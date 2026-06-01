import java.util.*;

/**
 * Task class representing a task within a project
 */
public class Task {
    private String id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String dueDate;
    private String assignee;
    private String projectId;
    private String createdAt;

    public Task() {
        this.id = generateId();
        this.createdAt = new Date().toInstant().toString();
    }

    public Task(String title) {
        this.title = title;
        this.id = generateId();
        this.status = "todo";
        this.priority = "medium";
        this.createdAt = new Date().toInstant().toString();
    }

    public Task(String title, String description, String status, String priority, String dueDate) {
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.dueDate = dueDate;
        this.id = generateId();
        this.createdAt = new Date().toInstant().toString();
    }

    public boolean markDone() {
        if (this.status != null && this.status.equals("done")) return false;
        this.status = "done";
        return true;
    }
    
    /**
     * Alias to match UML
     */
    public boolean markdone() {
        return markDone();
    }

    public boolean assignTask() { 
        return this.assignee != null && !this.assignee.isEmpty(); 
    }
    
    /**
     * Alias to match UML
     */
    public boolean assigntask() {
        return assignTask();
    }

    public void updateStatus(String newStatus) {
        if (isValidStatus(newStatus)) { this.status = newStatus; }
    }
    
    public boolean uploadStatus() { 
        return true; 
    }
    
    /**
     * Alias to match UML
     */
    public boolean uploadstatus() {
        return uploadStatus();
    }

    private boolean isValidStatus(String status) {
        return status.equals("todo") || status.equals("inprogress") || status.equals("done");
    }

    private String generateId() { return UUID.randomUUID().toString(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}