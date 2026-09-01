package store

import (
	"fmt"
	"sync"
	"time"

	"ate-operations-suite/models"
)

type Store struct {
	mu         sync.RWMutex
	operations map[string]models.Operation
}

func NewStore() *Store {
	s := &Store{
		operations: make(map[string]models.Operation),
	}
	s.seedDefaultData()
	return s
}

func (s *Store) seedDefaultData() {
	now := time.Now()
	seeds := []models.Operation{
		{
			ID:             "op-101",
			Title:          "Implement Go REST API & Gin/Net HTTP Router",
			Description:    "Build thread-safe RESTful API endpoints for operation management with JSON payload validation.",
			Category:       "Development",
			Priority:       "High",
			Status:         "In Progress",
			Lead:           "Manveer Singh",
			DueDate:        now.AddDate(0, 0, 7).Format("2006-01-02"),
			EstimatedHours: 16,
			Tags:           []string{"Golang", "Backend", "REST"},
			Archived:       false,
			CreatedAt:      now.Add(-24 * time.Hour),
		},
		{
			ID:             "op-102",
			Title:          "Dockerize Go Microservice with Multi-stage Alpine Build",
			Description:    "Configure Dockerfile using golang:alpine builder stage and minimal alpine runtime container.",
			Category:       "Operations",
			Priority:       "Urgent",
			Status:         "Completed",
			Lead:           "DevOps Engineer",
			DueDate:        now.AddDate(0, 0, 2).Format("2006-01-02"),
			EstimatedHours: 8,
			Tags:           []string{"Docker", "DevOps", "Alpine"},
			Archived:       false,
			CreatedAt:      now.Add(-48 * time.Hour),
		},
		{
			ID:             "op-103",
			Title:          "GitLab CI Pipeline & Automated Testing",
			Description:    "Set up .gitlab-ci.yml with Go unit test execution, static analysis, and Docker image build steps.",
			Category:       "Operations",
			Priority:       "Medium",
			Status:         "To Do",
			Lead:           "CI/CD Team",
			DueDate:        now.AddDate(0, 0, 10).Format("2006-01-02"),
			EstimatedHours: 12,
			Tags:           []string{"GitLab", "CI/CD", "Testing"},
			Archived:       false,
			CreatedAt:      now,
		},
		{
			ID:             "op-104",
			Title:          "System Health Monitoring & Metrics Endpoint",
			Description:    "Expose /health and /metrics endpoints returning application uptime and operational statistics.",
			Category:       "Finance",
			Priority:       "High",
			Status:         "Under Review",
			Lead:           "Elena Rostova",
			DueDate:        now.AddDate(0, 0, 4).Format("2006-01-02"),
			EstimatedHours: 10,
			Tags:           []string{"Metrics", "Monitoring"},
			Archived:       false,
			CreatedAt:      now.Add(-12 * time.Hour),
		},
	}

	for _, op := range seeds {
		s.operations[op.ID] = op
	}
}

// GetAll returns all operations
func (s *Store) GetAll(includeArchived bool) []models.Operation {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.Operation, 0, len(s.operations))
	for _, op := range s.operations {
		if includeArchived || !op.Archived {
			result = append(result, op)
		}
	}
	return result
}

// GetByID retrieves a single operation
func (s *Store) GetByID(id string) (models.Operation, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	op, exists := s.operations[id]
	return op, exists
}

// Create inserts a new operation
func (s *Store) Create(op models.Operation) models.Operation {
	s.mu.Lock()
	defer s.mu.Unlock()

	if op.ID == "" {
		op.ID = fmt.Sprintf("op-%d", time.Now().UnixNano()/1e6)
	}
	op.CreatedAt = time.Now()
	s.operations[op.ID] = op
	return op
}

// Update modifies an existing operation
func (s *Store) Update(id string, updated models.Operation) (models.Operation, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	op, exists := s.operations[id]
	if !exists {
		return models.Operation{}, false
	}

	updated.ID = id
	updated.CreatedAt = op.CreatedAt
	s.operations[id] = updated
	return updated, true
}

// Delete permanently removes an operation
func (s *Store) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.operations[id]; !exists {
		return false;
	}
	delete(s.operations, id)
	return true
}

// Archive toggles archived flag
func (s *Store) SetArchived(id string, archived bool) (models.Operation, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	op, exists := s.operations[id]
	if !exists {
		return models.Operation{}, false
	}

	op.Archived = archived
	s.operations[id] = op
	return op, true
}

// GetStats computes operational metrics
func (s *Store) GetStats() models.OperationalStats {
	s.mu.RLock()
	defer s.mu.RUnlock()

	now := time.Now()
	stats := models.OperationalStats{
		CategoryBreakdown: make(map[string]int),
		PriorityBreakdown: map[string]int{"Low": 0, "Medium": 0, "High": 0, "Urgent": 0},
	}

	for _, op := range s.operations {
		if op.Archived {
			continue
		}

		stats.Total++
		if op.Status == "Completed" {
			stats.Completed++
		}
		if op.Status == "In Progress" {
			stats.InProgress++
		}
		if op.Priority == "Urgent" {
			stats.Urgent++
		}

		// Overdue check
		if op.Status != "Completed" && op.DueDate != "" {
			if dueDate, err := time.Parse("2006-01-02", op.DueDate); err == nil {
				if dueDate.Before(now.Truncate(24 * time.Hour)) {
					stats.Overdue++
				}
			}
		}

		stats.TotalEstimatedHours += op.EstimatedHours
		stats.CategoryBreakdown[op.Category]++
		stats.PriorityBreakdown[op.Priority]++
	}

	if stats.Total > 0 {
		stats.CompletionRate = (stats.Completed * 100) / stats.Total
	}

	return stats
}
