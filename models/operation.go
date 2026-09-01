package models

import "time"

type Operation struct {
	ID             string    `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Category       string    `json:"category"`       // Development, Design, Marketing, Finance, Operations
	Priority       string    `json:"priority"`       // Low, Medium, High, Urgent
	Status         string    `json:"status"`         // Backlog, To Do, In Progress, Under Review, Completed
	Lead           string    `json:"lead"`           // e.g. Lead Engineer
	DueDate        string    `json:"dueDate"`        // YYYY-MM-DD
	EstimatedHours int       `json:"estimatedHours"` // Number of hours
	Tags           []string  `json:"tags"`
	Archived       bool      `json:"archived"`
	CreatedAt      time.Time `json:"createdAt"`
}

type OperationalStats struct {
	Total               int            `json:"total"`
	Completed           int            `json:"completed"`
	InProgress          int            `json:"inProgress"`
	Urgent              int            `json:"urgent"`
	Overdue             int            `json:"overdue"`
	TotalEstimatedHours int            `json:"totalEstimatedHours"`
	CompletionRate      int            `json:"completionRate"`
	CategoryBreakdown   map[string]int `json:"categoryBreakdown"`
	PriorityBreakdown   map[string]int `json:"priorityBreakdown"`
}
