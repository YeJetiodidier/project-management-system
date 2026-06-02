import java.util.*;

public class Milestone {
    // ─── ENCAPSULATION ───────────────────────────────────────────────
    // Fields are private. Status defaults are applied inside the
    // constructors, keeping the object valid from the moment it is
    // created and preventing external code from leaving it in a
    // half-initialised state.
    private String id;
    private String name;
    private String deadline;
    private String projectId;
    private String status;

    // ─── POLYMORPHISM (Constructor Overloading) ──────────────────────
    // The (name, projectId) constructor calls this() to reuse the
    // default id/status initialisation. Two different parameter lists
    // mean two different ways to instantiate the class.
    public Milestone() {
        this.id = UUID.randomUUID().toString();
        this.status = "pending";
    }

    public Milestone(String name, String projectId) {
        this();
        this.name = name;
        this.projectId = projectId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
