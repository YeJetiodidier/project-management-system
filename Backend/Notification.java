import java.util.*;

/**
 * Notification class representing a notification in the system
 *
 * OOP Concepts Demonstrated:
 *  - ENCAPSULATION: id, type, userId, projectName and relatedTaskId are
 *    private. 'message' is protected (subclass-friendly); isread,
 *    timestamp and data are public per the UML contract.
 *  - POLYMORPHISM (Constructor Overloading): Default and (message, type)
 *    constructors let callers create a fresh notification or a hydrated
 *    one. The 'send' and 'mark' methods also provide multiple ways to
 *    interact with the same state.
 *  - POLYMORPHISM (Method Overloading): matchesFilter() handles several
 *    filter kinds ('all', 'unread', 'mentions') — the same method name
 *    behaves differently depending on the input string.
 */
public class Notification {
    // ─── ENCAPSULATION ───────────────────────────────────────────────
    // A mix of private, protected and public fields is used here to
    // honour the UML. Even the 'public' fields still pair with getters
    // and setters so access can later be tightened without breaking
    // existing callers.
    private String id;
    protected String message; // protected per UML
    private String type;
    public boolean isread; // public per UML
    public String timestamp; // public per UML
    public String data; // public per UML
    private String userId;
    private String projectName;
    private String relatedTaskId;

    // ─── POLYMORPHISM (Constructor Overloading) ──────────────────────
    // Two constructors with different parameter lists let callers
    // create a Notification either empty (e.g. when hydrating from a
    // database) or with an initial message and type.
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

    // ─── ABSTRACTION ─────────────────────────────────────────────────
    // send() and mark() hide the rules about timestamps and read state
    // inside the object. Callers don't manipulate isread/timestamp
    // directly — they go through these controlled methods.
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

    // ─── POLYMORPHISM (Method Overloading via branching logic) ───────
    // matchesFilter() takes a single argument but behaves differently
    // for "all", "unread" and "mentions". This is a form of parametric
    // polymorphism: one method name, multiple behaviours.
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