import java.util.*;

public class Message {
    private String id;
    private String senderId;
    private String receiverId;
    private String content;
    private String sentAt;
    private String projectId;

    public Message() {
        this.id = UUID.randomUUID().toString();
        this.sentAt = new Date().toInstant().toString();
    }

    public Message(String senderId, String receiverId, String content) {
        this();
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getSentAt() { return sentAt; }
    public void setSentAt(String sentAt) { this.sentAt = sentAt; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
}
