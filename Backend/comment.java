import java.util.*;

/**
 * Comment class representing a comment in the project management system
 */
public class Comment {
    protected String id;
    public String text;
    protected String author;
    private String taskId;
    private String projectId;
    public String data;

    public Comment() {
        this.id = generateId();
    }

    public Comment(String text, String author) {
        this.id = generateId();
        this.text = text;
        this.author = author;
        this.data = new Date().toString();
    }

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
