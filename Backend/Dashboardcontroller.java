import java.util.*;

/**
 * DashboardController class handling dashboard-related operations
 */
public class Dashboardcontroller {
    private String userid; // per UML
    private Object projectdata; // per UML
    public Object taskdata; // public per UML
    private Database database;

    public Dashboardcontroller() { 
        this.database = new Database(); 
    }
    
    public Dashboardcontroller(Database db) { 
        this.database = db; 
    }

    public Object getDashboard(String userId) {
        this.userid = userId;
        Map<String, Object> dashboard = new HashMap<>();
        User user = database.getUserById(userId);
        if (user != null) {
            dashboard.put("user", user);
            List<Task> userTasks = database.getTasksByAssignee(userId);
            dashboard.put("tasks", userTasks);
            List<Project> projects = database.getAllProjects();
            dashboard.put("projects", projects);
        }
        return dashboard;
    }
    
    /**
     * Alias to match UML
     */
    public Object getdashboard(String userid) {
        return getDashboard(userid);
    }

    public Object getActivity(String userId) {
        List<Notification> activities = database.getNotificationsByUser(userId);
        return activities;
    }

    /**
     * Alias to match UML
     */
    public Object getactivity(String userid) {
        return getActivity(userid);
    }

    public Object processProjectData(Object projectData) {
        this.projectdata = projectData;
        return projectData;
    }

    /**
     * Alias to match UML
     */
    public Object processprojectdata(Object projectdata) {
        return processProjectData(projectdata);
    }

    public Object processTaskData(Object taskData) {
        this.taskdata = taskData;
        return taskData;
    }

    /**
     * Alias to match UML
     */
    public Object processtaskdata(Object taskdata) {
        return processTaskData(taskdata);
    }

    public Object aggregateDatabaseData() {
        Map<String, Object> aggregatedData = new HashMap<>();
        aggregatedData.put("totalProjects", database.getTotalProjects());
        aggregatedData.put("totalTasks", database.getTotalTasks());
        aggregatedData.put("totalUsers", database.getTotalUsers());
        aggregatedData.put("completedTasks", database.getCompletedTasks());
        return aggregatedData;
    }

    /**
     * Alias to match UML
     */
    public Object aggregatedatabasedata() {
        return aggregateDatabaseData();
    }

    public Map<String, Integer> getDashboardStats() {
        Map<String, Integer> stats = new HashMap<>();
        stats.put("projects", database.getTotalProjects());
        stats.put("tasks", database.getTotalTasks());
        stats.put("users", database.getTotalUsers());
        stats.put("completed", database.getCompletedTasks());
        return stats;
    }

    public List<Project> getProjectsByStatus(String status) { return database.getProjectsByStatus(status); }
    public List<Task> getTasksByStatus(String status) { return database.getTasksByStatus(status); }

    public String getUserid() { return userid; }
    public void setUserid(String userid) { this.userid = userid; }
    public Object getProjectdata() { return projectdata; }
    public void setProjectdata(Object projectdata) { this.projectdata = projectdata; }
    public Object getTaskdata() { return taskdata; }
    public void setTaskdata(Object taskdata) { this.taskdata = taskdata; }
    public Database getDatabase() { return database; }
    public void setDatabase(Database database) { this.database = database; }
}