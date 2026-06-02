import java.util.*;

public class User {
    // ─── ENCAPSULATION ───────────────────────────────────────────────
    // Fields are 'private' so they cannot be modified directly from outside
    // the class. Access is controlled through the public getters/setters below,
    // which also lets us add validation, hashing, or logging in one place.
    private String id;
    private String email;
    private String username;
    private String userId;
    private String password;
    private String role;
    private String name;
    private Date createdAt;

    // ─── POLYMORPHISM (Constructor Overloading) ──────────────────────
    // Multiple constructors with different parameter lists give callers
    // several ways to instantiate a User object. The compiler picks the
    // right one based on the arguments provided at the call site.
    /**
     * Default constructor
     */
    public User() {
    }

    /**
     * Constructor with parameters
     */
    public User(String email, String name, String role) {
        this.email = email;
        this.name = name;
        this.role = role;
        this.id = generateId();
        this.createdAt = new Date();
    }

    // ─── ABSTRACTION ─────────────────────────────────────────────────
    // login() hides the credential-comparison details. Callers only need
    // to know that they pass an email/password and get back a boolean;
    // they don't see the hash comparison logic inside.
    /**
     * Login method - validates credentials by email and password only
     */
    public boolean login(String email, String password) {
        if (this.email == null || !this.email.equals(email)) return false;
        if (this.password == null || !this.password.equals(hashPassword(password))) return false;
        return true;
    }


    /**
     * Register/Create a new user account
     */
    public void register(String email, String name, String password, String role, String credential) {
        this.email = email;
        this.name = name;
        this.password = hashPassword(password);
        this.role = role != null && role.equals("manager") ? "manager" : "member";
        this.id = generateId();
        if (this.role.equals("manager")) {
            this.username = credential;
        } else {
            this.userId = credential;
            this.username = name;
        }
        this.createdAt = new Date();
    }

    // ─── EXCEPTION HANDLING ──────────────────────────────────────────
    // The try/catch wraps the cryptographic operations so that if the
    // SHA-256 algorithm is unavailable (NoSuchAlgorithmException) or any
    // other error occurs, the method gracefully falls back to the raw
    // password instead of crashing the program.
    /**
     * Hash the password string with SHA-256.
     */
    public static String hashPassword(String password) {
        if (password == null) return null;
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return password;
        }
    }

    public boolean verifyPassword(String password) {
        if (password == null || this.password == null) return false;
        return this.password.equals(hashPassword(password));
    }

    public void setPasswordHash(String passwordHash) {
        this.password = passwordHash;
    }

    /**
     * Assign a task to this user
     */
    public void assignTask(String taskId) {
        // Logic handled in Task/Project classes, but leaving stub if necessary
        System.out.println("Assigned task " + taskId + " to user " + this.name);
    }
    
    /**
     * Alias for assignment to match UML spec
     */
    public void assigntask(String name) {
        assignTask(name);
    }

    /**
     * Add a comment to a task or project
     */
    public String comment() {
        return "Comment added by " + this.name;
    }

    /**
     * Assign a role to the user
     */
    public String assignRole(String newRole) {
        this.role = newRole;
        return "Role assigned: " + newRole;
    }
    
    /**
     * Alias for role assignment to match UML spec
     */
    public String assignrole(String role) {
        return assignRole(role);
    }

    /**
     * Helper method to generate unique ID
     */
    private String generateId() {
        return UUID.randomUUID().toString();
    }

    // ─── ENCAPSULATION (Getters & Setters) ────────────────────────────
    // Public accessor/mutator methods are the controlled gateway to the
    // private fields above. Notice setPassword() automatically hashes the
    // input — a good example of encapsulating business rules around data.
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = hashPassword(password); }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}