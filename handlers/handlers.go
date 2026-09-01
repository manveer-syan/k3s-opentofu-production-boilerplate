package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"ate-operations-suite/models"
	"ate-operations-suite/store"
)

type Handler struct {
	Store *store.Store
}

func NewHandler(s *store.Store) *Handler {
	return &Handler{Store: s}
}

// HealthCheckHandler returns 200 OK for DevOps monitoring
func (h *Handler) HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"uptime":    "running",
		"service":   "ate-operations-go",
	})
}

// StatsHandler returns system operational statistics
func (h *Handler) StatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	stats := h.Store.GetStats()
	json.NewEncoder(w).Encode(stats)
}

// OperationsHandler handles GET (list) and POST (create)
func (h *Handler) OperationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		includeArchived := r.URL.Query().Get("archived") == "true"
		categoryFilter := r.URL.Query().Get("category")
		priorityFilter := r.URL.Query().Get("priority")
		statusFilter := r.URL.Query().Get("status")
		searchQuery := strings.ToLower(r.URL.Query().Get("search"))

		allOps := h.Store.GetAll(includeArchived)
		filtered := make([]models.Operation, 0)

		for _, op := range allOps {
			if categoryFilter != "" && categoryFilter != "All" && op.Category != categoryFilter {
				continue
			}
			if priorityFilter != "" && priorityFilter != "All" && op.Priority != priorityFilter {
				continue
			}
			if statusFilter != "" && statusFilter != "All" && op.Status != statusFilter {
				continue
			}
			if searchQuery != "" {
				inTitle := strings.Contains(strings.ToLower(op.Title), searchQuery)
				inDesc := strings.Contains(strings.ToLower(op.Description), searchQuery)
				inLead := strings.Contains(strings.ToLower(op.Lead), searchQuery)
				if !inTitle && !inDesc && !inLead {
					continue
				}
			}
			filtered = append(filtered, op)
		}

		json.NewEncoder(w).Encode(filtered)

	case http.MethodPost:
		var op models.Operation
		if err := json.NewDecoder(r.Body).Decode(&op); err != nil {
			http.Error(w, `{"error":"Invalid JSON payload"}`, http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(op.Title) == "" {
			http.Error(w, `{"error":"Title is required"}`, http.StatusBadRequest)
			return
		}

		created := h.Store.Create(op)
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(created)

	default:
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// OperationItemHandler handles GET, PUT, DELETE for /api/v1/operations/{id}
func (h *Handler) OperationItemHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/operations/")
	parts := strings.Split(path, "/")
	id := parts[0]

	if id == "" {
		http.Error(w, `{"error":"Missing operation ID"}`, http.StatusBadRequest)
		return
	}

	// Handle /archive sub-route
	if len(parts) > 1 && parts[1] == "archive" && r.Method == http.MethodPost {
		var req struct {
			Archived bool `json:"archived"`
		}
		json.NewDecoder(r.Body).Decode(&req)
		updated, ok := h.Store.SetArchived(id, req.Archived)
		if !ok {
			http.Error(w, `{"error":"Operation not found"}`, http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(updated)
		return
	}

	switch r.Method {
	case http.MethodGet:
		op, exists := h.Store.GetByID(id)
		if !exists {
			http.Error(w, `{"error":"Operation not found"}`, http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(op)

	case http.MethodPut:
		var updated models.Operation
		if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
			http.Error(w, `{"error":"Invalid JSON payload"}`, http.StatusBadRequest)
			return
		}

		res, ok := h.Store.Update(id, updated)
		if !ok {
			http.Error(w, `{"error":"Operation not found"}`, http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(res)

	case http.MethodDelete:
		ok := h.Store.Delete(id)
		if !ok {
			http.Error(w, `{"error":"Operation not found"}`, http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Operation deleted successfully"})

	default:
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}
