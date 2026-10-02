// Check token expiration
if time.Now().After(claims["exp"]) {
    http.Error(w, "Token expired", http.StatusUnauthorized)
    return
}