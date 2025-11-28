package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
)

func main() {
	http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "pong v2")
	})

	http.HandleFunc("/ready", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "ready v2")
	})

	// /feature доступен всегда, но отвечает только если заголовок X-Feature-Enabled: true
	http.HandleFunc("/feature", func(w http.ResponseWriter, r *http.Request) {
		enabled := strings.EqualFold(r.Header.Get("X-Feature-Enabled"), "true")
		if !enabled {
			w.WriteHeader(http.StatusForbidden)
			fmt.Fprintf(w, "Feature X is disabled. Set header X-Feature-Enabled: true")
			return
		}
		fmt.Fprintf(w, "Feature X is enabled via header!")
	})

	log.Println("Server v2 running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
