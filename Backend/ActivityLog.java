import java.util.*;

public class ActivityLog {
    // ─── ENCAPSULATION ───────────────────────────────────────────────
    // Private fields. The id and timestamp are generated inside the
    // constructors, hiding the format choices from external code.
    private String id;
    private String userId;
    private String action;
    private String timestamp;
    private String projectId;

    // ─── POLYMORPHISM (Constructor Overloading) ──────────────────────
    // Two constructors with different parameter lists. The (userId,
    // action) constructor calls this() to inherit the id/timestamp
    // initialisation — a common reuse pattern with overloading.
    public ActivityLog() {
        this.id = UUID.randomUUID().toString();
        this.timestamp = new Date().toInstant().toString();
    }

    public ActivityLog(String userId, String action) {
        this();
        this.userId = userId;
        this.action = action;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
}
