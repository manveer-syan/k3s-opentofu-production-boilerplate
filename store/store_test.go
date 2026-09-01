package store

import (
	"testing"

	"ate-operations-suite/models"
)

func TestStoreCreateAndGet(t *testing.T) {
	s := NewStore()

	op := models.Operation{
		Title:    "Test Operation",
		Category: "Development",
		Priority: "High",
		Status:   "To Do",
	}

	created := s.Create(op)
	if created.ID == "" {
		t.Fatalf("Expected non-empty ID for created operation")
	}

	retrieved, exists := s.GetByID(created.ID)
	if !exists {
		t.Fatalf("Expected to find operation with ID %s", created.ID)
	}

	if retrieved.Title != "Test Operation" {
		t.Errorf("Expected title 'Test Operation', got '%s'", retrieved.Title)
	}
}

func TestStoreDelete(t *testing.T) {
	s := NewStore()

	op := s.Create(models.Operation{Title: "To Be Deleted"})
	deleted := s.Delete(op.ID)
	if !deleted {
		t.Fatalf("Expected delete to return true")
	}

	_, exists := s.GetByID(op.ID)
	if exists {
		t.Fatalf("Expected operation to be deleted")
	}
}

func TestStoreStats(t *testing.T) {
	s := NewStore()
	stats := s.GetStats()

	if stats.Total < 1 {
		t.Errorf("Expected total operations to be > 0, got %d", stats.Total)
	}
}
