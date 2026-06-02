import java.util.*;

public class DashboardUI {
    public String userid; // public per UML
    public Object dashboard; // public per UML
    public String activity; // public per UML
    // ─── ENCAPSULATION ───────────────────────────────────────────────
    // 'role' is private and only reachable through getRole()/setRole().
    private String role;

    // ─── POLYMORPHISM (Constructor Overloading) ──────────────────────
    // Two constructors with different parameter lists.
    public DashboardUI() {}

    public DashboardUI(String userid) {
        this.userid = userid;
    }

    // ─── POLYMORPHISM (Method Overloading) ───────────────────────────
    // Each pair below (camelCase + lowercase alias) is a deliberate
    // overload. Both names work; the lowercase versions simply
    // delegate to the primary ones.
    public void displayDashboard() {}

    /**
     * Alias to match UML
     */
    public void displaydashboard() {
        displayDashboard();
    }

    public void accessDashboard(String userId) {
        this.userid = userId;
    }

    /**
     * Alias to match UML
     */
    public void accessdashboard(String userid) {
        accessDashboard(userid);
    }

    // ─── ABSTRACTION ─────────────────────────────────────────────────
    // renderActivity() hides the string-formatting detail and the
    // 'activity' field update inside one call.
    public String renderActivity(String activity) {
        this.activity = activity;
        return "Activity rendered: " + activity;
    }

    /**
     * Alias to match UML
     */
    public String renderactivity(String activity) {
        return renderActivity(activity);
    }

    public void renderWorkload(String activity) {
        System.out.println("Rendering workload: " + activity);
    }

    /**
     * Alias to match UML
     */
    public void renderworkload(String activity) {
        renderWorkload(activity);
    }

    public Object getDashboardStats() { return dashboard; }
    public void updateDashboard(Object data) { this.dashboard = data; }

    public String getUserid() { return userid; }
    public void setUserid(String userid) { this.userid = userid; }
    public Object getDashboard() { return dashboard; }
    public void setDashboard(Object dashboard) { this.dashboard = dashboard; }
    public String getActivity() { return activity; }
    public void setActivity(String activity) { this.activity = activity; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}