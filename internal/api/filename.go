package api

import (
	"encoding/hex"
	"strings"
)

func sanitizeFilename(name string) string {
	var b strings.Builder
	for _, r := range name {
		switch {
		case r < 0x20 || r == 0x7f: // we get rid of control chars, like \r \n
			continue
		case r == '/' || r == '\\' || r == '"':
			continue
		default:
			b.WriteRune(r)
		}
	}

	out := strings.ToValidUTF8(strings.TrimSpace(b.String()), "")
	out = strings.Trim(out, ". ")
	if runes := []rune(out); len(runes) > 200 {
		out = string(runes[:200])
	}
	if out == "" {
		return "file"
	}
	return out
}

// builds a Content-Disposition, The ASCII filename is a fallback, filename* carries the
// original name
func disposition(name string) string {
	safe := sanitizeFilename(name)

	var ascii strings.Builder
	for _, r := range safe {
		if r > 0x7f {
			ascii.WriteRune('_')
			continue
		}
		ascii.WriteRune(r)
	}
	return `attachment; filename="` + ascii.String() + `"; filename*=UTF-8''` + attrChar(safe)
}

func attrChar(s string) string {
	var b strings.Builder
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' ||
			strings.IndexByte("!#$&+-.^_`|~", c) >= 0 {
			b.WriteByte(c)
			continue
		}
		b.WriteByte('%')
		b.WriteString(strings.ToUpper(hex.EncodeToString([]byte{c})))
	}
	return b.String()
}
