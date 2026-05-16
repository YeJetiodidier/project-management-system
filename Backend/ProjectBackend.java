import java.util.ArrayList;
import java.util.List;

class Task {
    String status;
    public Task(String status) {
        this.status = status;
    }
    public String getStatus() {
        return status;
    }
}

class User {
    String name;
    public User(String name) {
        this.name = name;
    }
}

// Project class
public class Project{

    private String projectName;
    private int projectId;

    private List<User> users;
    private List<Task> tasks;

    // Constructor creates a new project
    public Project(String projectName, int projectId) {
        this.projectName = projectName;
        this.projectId = projectId;

        users = new ArrayList<>();
        tasks = new ArrayList<>();
    }

    // Handles project operations
    public double manageProject(String operationType, List<User> newUsers) {
        // Creates project
        if (operationType.equalsIgnoreCase("create")) {
            System.out.println("Project created successfully");
            return 0;
        }

        // Adds users to project
        else if (operationType.equalsIgnoreCase("assignUsers")) {
            for (User user : newUsers) {
                users.add(user);
            }
            System.out.println("Users added successfully");
            return 0;
        }

        // Calculates project progress
        else if (operationType.equalsIgnoreCase("calculateProgress")) {
            int completed = 0;
            int total = tasks.size();
            for (Task task : tasks) {
                if (task.getStatus().equalsIgnoreCase("done")) {
                    completed++;
                }
            }
            if (total > 0) {
                return (double) completed / total;
            }
            else {
                return 0;
            }
        }

        // Invalid operations
        else {

            System.out.println("Invalid operation");

            return -1;
        }
    }

    // Adds task into project
    public void addTask(Task task) {

        tasks.add(task);
    }

    // Displays project information
    public void displayProject() {

        System.out.println("\nProject Information");

        System.out.println("Project Name: " + projectName);

        System.out.println("Project ID: " + projectId);

        System.out.println("Total Users: " + users.size());

        System.out.println("Total Tasks: " + tasks.size());
    }

    // Main 
    public static void main(String[] args) {

        Project project = new Project("School System", 101);

        List<User> userList = new ArrayList<>();

        userList.add(new User("Alice"));
        userList.add(new User("Bob"));

        project.manageProject("assignUsers",userList);

        project.addTask(new Task("done"));
        project.addTask(new Task("pending"));
        project.addTask(new Task("done"));

        double progress = project.manageProject("calculateProgress", null);

        project.displayProject();

        System.out.println(
                "\nProject Progress: " + (progress * 100) + "%");
    }
}
