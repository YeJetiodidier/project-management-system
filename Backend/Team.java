import java.util.*;

public class Team {
    // ─── ENCAPSULATION ───────────────────────────────────────────────
    // Private fields. Direct access is forbidden; addMember(),
    // removeMember(), and updateLeader() guard the internal list and
    // enforce rules like 'the leader cannot be removed'.
    private String id;
    private String name;
    private List<String> members;
    private String leader;
    private Date createdAt;

    // ─── POLYMORPHISM (Constructor Overloading) ──────────────────────
    // Two constructors with different parameter lists, giving callers
    // a choice between an empty Team and a Team that already has a leader.
    public Team() {
        this.id = generateId();
        this.members = new ArrayList<>();
        this.createdAt = new Date();
    }

    public Team(String name, String leaderId) {
        this.name = name;
        this.leader = leaderId;
        this.id = generateId();
        this.members = new ArrayList<>();
        this.members.add(leaderId);
        this.createdAt = new Date();
    }

    public void addMember(String id, String name) {
        if (!this.members.contains(id)) {
            this.members.add(id);
        }
    }
    
    /**
     * Alias to match UML
     */
    public void addmember(String id, String name) {
        addMember(id, name);
    }

    public void removeMember(String id, String name) {
        if (!id.equals(this.leader)) {
            this.members.remove(id);
        }
    }

    /**
     * Alias to match UML
     */
    public void removemember(String id, String name) {
        removeMember(id, name);
    }

    public int getMemberCount() { 
        return this.members.size(); 
    }
    
    public void updateLeader(String newLeaderId) {
        if (this.members.contains(newLeaderId)) {
            this.leader = newLeaderId;
        }
    }

    private String generateId() { 
        return UUID.randomUUID().toString(); 
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<String> getMembers() { return members; }
    public void setMembers(List<String> members) { this.members = members; }
    public String getLeader() { return leader; }
    public void setLeader(String leader) { this.leader = leader; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}