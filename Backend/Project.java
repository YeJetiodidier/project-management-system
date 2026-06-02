import java.util.*;

public class Project {
    // ─── ENCAPSULATION ───────────────────────────────────────────────
    // Every field below is 'private'. External code can only read or modify
    // them through the public getters/setters further down — this keeps
    // invariants (e.g. progress between 0 and 100) inside the class.
    private String id;
    private String name;
    private String description;
    private String status;
    private String priority;
    private String dateline;
    private String assignee;
    private String createdAt;
    private float progress;
    private List<String> teamMembers;

    // ─── POLYMORPHISM (Constructor Overloading) ──────────────────────
    // The three constructors have different parameter lists, so the Java
    // compiler picks the right one at the call site. This is compile-time
    // polymorphism (also called method/constructor overloading).
    public Project() {
        this.id = generateId();
        this.createdAt = new Date().toInstant().toString();
        this.teamMembers = new ArrayList<>();
        this.progress = 0.0f;
    }

    public Project(String name) {
        this.name = name;
        this.id = generateId();
        this.createdAt = new Date().toInstant().toString();
        this.progress = 0.0f;
        this.teamMembers = new ArrayList<>();
    }

    public Project(String name, String description, String status, String priority, String dateline) {
        this.name = name;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.dateline = dateline;
        this.id = generateId();
        this.createdAt = new Date().toInstant().toString();
        this.progress = 0.0f;
        this.teamMembers = new ArrayList<>();
    }

    // ─── ABSTRACTION ─────────────────────────────────────────────────
    // updateProgress() hides the validation rule (0-100 range) inside
    // the method body. Callers do not need to know about the bounds; they
    // just call the method and trust the object to keep itself consistent.
    public float calculateProgress() {
        return this.progress;
    }

    /**
     * Alias for calculation to match UML
     */
    public float calculateprogress() {
        return calculateProgress();
    }

    public void assignUser(String userId) {
        if (!this.teamMembers.contains(userId)) {
            this.teamMembers.add(userId);
        }
    }
    
    /**
     * Alias for user assignment to match UML
     */
    public String assigfnuser() {
        if (!this.teamMembers.isEmpty()) {
            return "User assigned";
        }
        return null;
    }

    public void removeUser(String userId) { 
        this.teamMembers.remove(userId); 
    }
    
    public void updateStatus(String newStatus) { 
        this.status = newStatus; 
    }
    
    public void updateProgress(float newProgress) {
        if (newProgress >= 0 && newProgress <= 100) {
            this.progress = newProgress;
        }
    }
    
    public String createproject() {
        return "Project created with ID: " + this.id;
    }

    private String generateId() { 
        return UUID.randomUUID().toString(); 
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getDateline() { return dateline; }
    public void setDateline(String dateline) { this.dateline = dateline; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public float getProgress() { return progress; }
    public void setProgress(float progress) { this.progress = progress; }
    public List<String> getTeamMembers() { return teamMembers; }
    public void setTeamMembers(List<String> teamMembers) { this.teamMembers = teamMembers; }
}