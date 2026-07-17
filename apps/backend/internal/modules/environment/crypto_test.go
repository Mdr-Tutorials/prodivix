package environment

import (
	"bytes"
	"encoding/base64"
	"testing"
)

func testMasterKey() string {
	return base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{0x2a}, 32))
}

func TestSecretCipherRequiresAuthenticatedContextAndDoesNotPersistPlaintext(t *testing.T) {
	cipher, err := newSecretCipher(testMasterKey())
	if err != nil {
		t.Fatalf("create cipher: %v", err)
	}
	canary := []byte("prodivix-secret-canary")
	nonce, ciphertext, err := cipher.encrypt(canary, []byte("workspace\x00environment\x00revision\x00token"))
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}
	if bytes.Contains(ciphertext, canary) {
		t.Fatal("ciphertext contains plaintext canary")
	}
	material, err := cipher.decrypt(nonce, ciphertext, []byte("workspace\x00environment\x00revision\x00token"))
	if err != nil || !bytes.Equal(material, canary) {
		t.Fatalf("decrypt exact context: %v", err)
	}
	clearBytes(material)
	if _, err := cipher.decrypt(nonce, ciphertext, []byte("workspace\x00environment\x00other\x00token")); err == nil {
		t.Fatal("ciphertext was accepted under a different environment revision")
	}
}

func TestSecretCipherRejectsMissingOrInvalidProductionKeys(t *testing.T) {
	for _, key := range []string{"", base64.StdEncoding.EncodeToString([]byte("too-short")), "not-base64"} {
		if _, err := newSecretCipher(key); err == nil {
			t.Fatalf("expected key rejection for %q", key)
		}
	}
}
