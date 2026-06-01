import java.util.ArrayList;
import java.util.List;

/**
 * ProjectBackend class - main backend for project management operations
 */
public class ProjectBackend {
    private String projectName;
    private int projectId;
    private List<User> users;
    private List<Task> tasks;
    private Database database;

    public ProjectBackend(String projectName, int projectId) {
        this.projectName = projectName;
        this.projectId = projectId;
        this.users = new ArrayList<>();
        this.tasks = new ArrayList<>();
        this.database = new Database();
    }

    public double manageProject(String operationType, List<User> newUsers) {
        if (operationType.equalsIgnoreCase("create")) {
            System.out.println("Project created successfully");
            return 0;
        } else if (operationType.equalsIgnoreCase("assignUsers")) {
            for (User user : newUsers) {
                users.add(user);
            }
            System.out.println("Users added successfully");
            return 0;
        } else if (operationType.equalsIgnoreCase("calculateProgress")) {
            int completed = 0;
            int total = tasks.size();
            for (Task task : tasks) {
                if ("done".equalsIgnoreCase(task.getStatus())) {
                    completed++;
                }
            }
            if (total > 0) {
                return (double) completed / total;
            } else {
                return 0;
            }
        } else {
            System.out.println("Invalid operation");
            return -1;
        }
    }

    public void addTask(Task task) { tasks.add(task); }
    public void displayProject() {
        System.out.println("\nProject Information");
        System.out.println("Project Name: " + projectName);
        System.out.println("Project ID: " + projectId);
        System.out.println("Total Users: " + users.size());
        System.out.println("Total Tasks: " + tasks.size());
    }
    public double getProjectProgress() { return manageProject("calculateProgress", null); }
    public List<Task> getProjectTasks() { return new ArrayList<>(tasks); }
    public List<User> getProjectUsers() { return new ArrayList<>(users); }
    public void updateProjectName(String newName) { this.projectName = newName; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public int getProjectId() { return projectId; }
    public void setProjectId(int projectId) { this.projectId = projectId; }
    public List<User> getUsers() { return users; }
    public void setUsers(List<User> users) { this.users = users; }
    public List<Task> getTasks() { return tasks; }
    public void setTasks(List<Task> tasks) { this.tasks = tasks; }
    public Database getDatabase() { return database; }
    public void setDatabase(Database database) { this.database = database; }

    public static void main(String[] args) {
        ProjectBackend project = new ProjectBackend("School System", 101);
        List<User> userList = new ArrayList<>();
        User alice = new User("alice@example.com", "Alice", "member");
        User bob = new User("bob@example.com", "Bob", "member");
        userList.add(alice);
        userList.add(bob);
        project.manageProject("assignUsers", userList);
        Task task1 = new Task("Design Database", "Create database schema", "done", "high", "2026-06-01");
        Task task2 = new Task("Backend API", "Implement REST API", "inprogress", "high", "2026-06-15");
        Task task3 = new Task("Frontend UI", "Build user interface", "todo", "medium", "2026-06-30");
        project.addTask(task1);
        project.addTask(task2);
        project.addTask(task3);
        double progress = project.manageProject("calculateProgress", null);
        project.displayProject();
        System.out.println("Project Progress: " + (progress * 100) + "%");
    }
}
