import java.util.*;

/**
 * Notification class representing a notification in the system
 */
public class Notification {
    private String id;
    protected String message; // protected per UML
    private String type;
    public boolean isread; // public per UML
    public String timestamp; // public per UML
    public String data; // public per UML
    private String userId;
    private String projectName;
    private String relatedTaskId;

    public Notification() {
        this.id = generateId();
    }

    public Notification(String message, String type) {
        this.id = generateId();
        this.message = message;
        this.type = type;
        this.isread = false;
        this.timestamp = new Date().toString();
    }

    public String send(String message) {
        this.message = message;
        this.timestamp = new Date().toString();
        return "Notification sent";
    }

    public boolean mark(boolean read) {
        this.isread = read;
        return this.isread;
    }

    public String dateline(String message) { 
        return this.timestamp; 
    }
    
    public boolean matchesFilter(String filterType) {
        if (filterType.equals("all")) return true;
        else if (filterType.equals("unread")) return !this.isread;
        else if (filterType.equals("mentions")) return this.type != null && this.type.equals("mentions");
        return false;
    }

    private String generateId() { 
        return UUID.randomUUID().toString(); 
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public boolean isRead() { return isread; }
    public void setRead(boolean read) { isread = read; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getRelatedTaskId() { return relatedTaskId; }
    public void setRelatedTaskId(String relatedTaskId) { this.relatedTaskId = relatedTaskId; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}