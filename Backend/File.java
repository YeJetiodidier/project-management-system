import java.util.*;
public class File {
    // ─── ENCAPSULATION ───────────────────────────────────────────────
    // Private fields. The owner/have references to User demonstrate
    // 'has-a' composition; both stay private and accessed via getters.
    private String id;
    private String filename;
    private String url;
    private String type;
    private User owner;
    private User have;
    private Date uploadedAt;
    private String uploadedBy;
    private String projectId;
    private String comment;

    // ─── POLYMORPHISM (Constructor Overloading) ──────────────────────
    // Two constructors with different parameter lists let callers create
    // a File in two different ways. The compiler picks the matching one
    // based on the arguments — compile-time polymorphism.
    public File() {
        this.id = generateId();
    }

    public File(String filename, String type) {
        this.id = generateId();
        this.filename = filename;
        this.type = type;
        this.uploadedAt = new Date();
    }

    public void upload() {
        if (this.id == null) {
            this.id = generateId();
        }
        this.uploadedAt = new Date();
        System.out.println("File uploaded: " + this.filename);
    }

    public void delete() {
        System.out.println("File deleted: " + this.filename);
    }
    
    public long getFileSize() { 
        return 0; // Stub for file size
    }

    private String generateId() { 
        return UUID.randomUUID().toString(); 
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public User getHave() { return have; }
    public void setHave(User have) { this.have = have; }
    public Date getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Date uploadedAt) { this.uploadedAt = uploadedAt; }
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}