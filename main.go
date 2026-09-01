package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"time"

	"ate-operations-suite/handlers"
	"ate-operations-suite/store"
)

//go:embed static/*
var staticFS embed.FS

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize Store and API Handlers
	s := store.NewStore()
	h := handlers.NewHandler(s)

	mux := http.NewServeMux()

	// REST API Routes
	mux.HandleFunc("/health", h.HealthCheckHandler)
	mux.HandleFunc("/api/v1/stats", h.StatsHandler)
	mux.HandleFunc("/api/v1/operations", h.OperationsHandler)
	mux.HandleFunc("/api/v1/operations/", h.OperationItemHandler)

	// Static Web Dashboard Files
	subFS, err := fs.Sub(staticFS, "static")
	if err != nil {
		log.Fatalf("Failed to load embedded static filesystem: %v", err)
	}

	fileServer := http.FileServer(http.FS(subFS))
	mux.Handle("/", fileServer)

	// Log startup details
	log.Printf("==================================================")
	log.Printf("🚀 ATE Operations Control Suite (Golang Backend)")
	log.Printf("📡 Server Listening on http://localhost:%s", port)
	log.Printf("🏥 Healthcheck Endpoint: http://localhost:%s/health", port)
	log.Printf("📊 REST API Base Route:  http://localhost:%s/api/v1/operations", port)
	log.Printf("==================================================")

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      loggingMiddleware(mux),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server stopped unexpectedly: %v", err)
	}
}

// loggingMiddleware logs HTTP request execution details
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		fmt.Printf("[%s] %s %s - %v\n", time.Now().Format("15:04:05"), r.Method, r.URL.Path, time.Since(start))
	})
}
