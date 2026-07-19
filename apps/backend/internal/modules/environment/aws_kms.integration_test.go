package environment

import (
	"bytes"
	"context"
	"errors"
	"os"
	"strings"
	"testing"
	"time"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	awskms "github.com/aws/aws-sdk-go-v2/service/kms"
)

func TestEnvironmentSecretAWSKMSLiveGate(t *testing.T) {
	region := strings.TrimSpace(os.Getenv("PRODIVIX_AWS_KMS_TEST_REGION"))
	oldKeyARN := strings.TrimSpace(os.Getenv("PRODIVIX_AWS_KMS_TEST_OLD_KEY_ARN"))
	activeKeyARN := strings.TrimSpace(os.Getenv("PRODIVIX_AWS_KMS_TEST_ACTIVE_KEY_ARN"))
	if region == "" && oldKeyARN == "" && activeKeyARN == "" {
		t.Skip("PRODIVIX_AWS_KMS_TEST_REGION and exact old/active key ARNs are not configured")
	}
	if region == "" || oldKeyARN == "" || activeKeyARN == "" || oldKeyARN == activeKeyARN {
		t.Fatal("managed KMS live Gate requires one region and two distinct exact key ARNs")
	}
	if err := validateAWSKMSRegion(region, map[string]string{"key-old": oldKeyARN, "key-active": activeKeyARN}); err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(t.Context(), 30*time.Second)
	defer cancel()
	configuration, err := awsconfig.LoadDefaultConfig(ctx, awsconfig.WithRegion(region))
	if err != nil {
		t.Fatal(err)
	}
	client := awskms.NewFromConfig(configuration)
	oldKMS, err := newAWSKMS("key-old", map[string]string{"key-old": oldKeyARN}, client, 10*time.Second)
	if err != nil {
		t.Fatal(err)
	}
	oldCipher, _ := newSecretEnvelopeCipher(oldKMS)
	additionalData := []byte("managed-kms-live-gate\x00environment\x00revision\x00binding")
	secret := []byte("prodivix-managed-kms-live-gate-canary")
	original, err := oldCipher.encrypt(ctx, secret, additionalData)
	if err != nil {
		t.Fatal(err)
	}

	rotatingKMS, err := newAWSKMS("key-active", map[string]string{
		"key-old":    oldKeyARN,
		"key-active": activeKeyARN,
	}, client, 10*time.Second)
	if err != nil {
		t.Fatal(err)
	}
	rotatingCipher, _ := newSecretEnvelopeCipher(rotatingKMS)
	rotated, err := rotatingCipher.rewrap(ctx, original, additionalData)
	if err != nil {
		t.Fatal(err)
	}
	if rotated.KeyID != "key-active" || bytes.Equal(rotated.WrappedKey, original.WrappedKey) {
		t.Fatal("live managed KMS Gate did not rotate the data-key envelope")
	}
	if !bytes.Equal(rotated.Nonce, original.Nonce) || !bytes.Equal(rotated.Ciphertext, original.Ciphertext) {
		t.Fatal("live managed KMS rotation rewrote Secret ciphertext")
	}
	material, err := rotatingCipher.decrypt(ctx, rotated, additionalData)
	if err != nil || !bytes.Equal(material, secret) {
		t.Fatalf("live managed KMS envelope did not resolve: %v", err)
	}
	clearBytes(material)
	if _, err := rotatingCipher.decrypt(ctx, rotated, []byte("wrong-aad")); !errors.Is(err, ErrPermissionDenied) {
		t.Fatalf("live managed KMS envelope accepted wrong authenticated context: %v", err)
	}

	retiredKMS, _ := newAWSKMS("key-active", map[string]string{"key-active": activeKeyARN}, client, 10*time.Second)
	retiredCipher, _ := newSecretEnvelopeCipher(retiredKMS)
	if _, err := retiredCipher.decrypt(ctx, original, additionalData); !errors.Is(err, ErrPermissionDenied) {
		t.Fatalf("old key remained addressable after managed KMS retirement fence: %v", err)
	}
}
