import java.util.*;

public class Comment {
    // ─── ENCAPSULATION ───────────────────────────────────────────────
    // 'private' fields can only be read/written through the public
    // getters/setters below. The 'protected' fields (id, author) are
    // still hidden from arbitrary external code but are accessible to
    // subclasses — a slightly looser form of encapsulation.
    protected String id;
    public String text;
    protected String author;
    private String taskId;
    private String projectId;
    public String data;

    // ─── POLYMORPHISM (Constructor Overloading) ──────────────────────
    // Two constructors with different signatures. The compiler selects
    // the matching one based on the arguments given by the caller.
    public Comment() {
        this.id = generateId();
    }

    public Comment(String text, String author) {
        this.id = generateId();
        this.text = text;
        this.author = author;
        this.data = new Date().toString();
    }

    // ─── ABSTRACTION ─────────────────────────────────────────────────
    // delete(requester) hides the authorization logic. Callers do not
    // need to know who can delete what; they just call delete() and
    // get a status string back.
    public String edit(String newText) {
        this.text = newText;
        return "Comment updated by " + this.author;
    }

    public String delete(String requester) {
        if (requester.equals(this.author)) {
            this.text = "[deleted]";
            return "Comment deleted";
        }
        return "Unauthorized to delete this comment";
    }

    private String generateId() { 
        return UUID.randomUUID().toString(); 
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
