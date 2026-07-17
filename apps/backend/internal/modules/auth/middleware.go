package auth

import "github.com/gin-gonic/gin"

const contextAuthUserKey = "authUser"
const contextAuthSessionKey = "authSession"

type AuthenticatedSession struct {
	ID        string
	UserID    string
	ExpiresAt int64
}

func RequireAuth[T any](
	resolveToken func(c *gin.Context) string,
	resolveSession func(token string) (*AuthenticatedSession, bool),
	resolveUser func(userID string) (*T, bool),
	onUnauthorized gin.HandlerFunc,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := resolveToken(c)
		if token == "" {
			onUnauthorized(c)
			c.Abort()
			return
		}
		session, ok := resolveSession(token)
		if !ok || session == nil {
			onUnauthorized(c)
			c.Abort()
			return
		}
		user, ok := resolveUser(session.UserID)
		if !ok {
			onUnauthorized(c)
			c.Abort()
			return
		}
		c.Set(contextAuthUserKey, user)
		c.Set(contextAuthSessionKey, session)
		c.Next()
	}
}

func GetAuthSession(c *gin.Context) (*AuthenticatedSession, bool) {
	value, ok := c.Get(contextAuthSessionKey)
	if !ok {
		return nil, false
	}
	session, ok := value.(*AuthenticatedSession)
	return session, ok && session != nil
}

func GetAuthUser[T any](c *gin.Context) (*T, bool) {
	value, ok := c.Get(contextAuthUserKey)
	if !ok {
		return nil, false
	}
	user, ok := value.(*T)
	if !ok {
		return nil, false
	}
	return user, true
}
