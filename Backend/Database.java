import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.sql.*;
import java.util.*;

public class Database {
    private Connection connection;
    private boolean connected;

    private List<User> users;
    private List<Project> projects;
    private List<Task> tasks;
    private List<Team> teams;
    private List<Notification> notifications;
    private List<Comment> comments;
    private List<File> files;
    private List<Message> messages;
    private List<Milestone> milestones;
    private List<ActivityLog> activityLogs;

    public Database() {
        users = new ArrayList<>();
        projects = new ArrayList<>();
        tasks = new ArrayList<>();
        teams = new ArrayList<>();
        notifications = new ArrayList<>();
        comments = new ArrayList<>();
        files = new ArrayList<>();
        messages = new ArrayList<>();
        milestones = new ArrayList<>();
        activityLogs = new ArrayList<>();
        try {
            loadConfigAndConnect();
            if (connected) initializeSchema();
        } catch (Exception e) {
            connected = false;
            System.err.println("[Database] Init failed, running in memory-only fallback: " + e.getMessage());
        }
    }

    private void loadConfigAndConnect() {
        String url = "jdbc:postgresql://localhost:5432/pms_db";
        String user = "postgres";
        String password = "nitan";

        try {
            Path configPath = Paths.get("config.properties");
            if (Files.exists(configPath)) {
                Properties props = new Properties();
                try (InputStream is = Files.newInputStream(configPath)) {
                    props.load(is);
                    if (props.containsKey("db.url")) url = props.getProperty("db.url");
                    if (props.containsKey("db.user")) user = props.getProperty("db.user");
                    if (props.containsKey("db.password")) password = props.getProperty("db.password");
                }
            }
            connection = DriverManager.getConnection(url, user, password);
            connected = true;
            System.out.println("[Database] Connected to PostgreSQL: " + url);
        } catch (Exception e) {
            connected = false;
            System.err.println("[Database] Could not connect: " + e.getMessage());
        }
    }

    private void initializeSchema() {
        try {
            Path schemaPath = Paths.get("schema.sql");
            if (Files.exists(schemaPath)) {
                String sql = new String(Files.readAllBytes(schemaPath), StandardCharsets.UTF_8);
                for (String statement : sql.split(";")) {
                    String trimmed = statement.trim();
                    if (!trimmed.isEmpty() && !trimmed.startsWith("--")) {
                        try (Statement stmt = connection.createStatement()) {
                            stmt.execute(trimmed);
                        }
                    }
                }
                System.out.println("[Database] Schema initialized from schema.sql");
            }
        } catch (Exception e) {
            System.err.println("[Database] Schema init error: " + e.getMessage());
        }
    }

    public void connect() {}
    public void disconnect() {
        if (connection != null) {
            try { connection.close(); } catch (SQLException e) { e.printStackTrace(); }
        }
    }

    private Connection c() { return connection; }
    private boolean ok() { return connected && connection != null; }

    // ─── User operations ─────────────────────────────────────────────

    public void saveUser(User user) {
        if (ok()) {
            String sql = "INSERT INTO users (id, email, name, role, username, user_id, password, created_at) VALUES (?,?,?,?,?,?,?,NOW()) ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name, role=EXCLUDED.role, username=EXCLUDED.username, user_id=EXCLUDED.user_id, password=EXCLUDED.password";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                ps.setString(1, user.getId());
                ps.setString(2, user.getEmail());
                ps.setString(3, user.getName());
                ps.setString(4, user.getRole());
                ps.setString(5, user.getUsername());
                ps.setString(6, user.getUserId());
                ps.setString(7, user.getPassword());
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            if (!users.contains(user)) users.add(user);
        }
    }

    public User getUserById(String userId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM users WHERE id=?")) {
                ps.setString(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) return mapUser(rs);
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return null;
        }
        for (User u : users) if (u.getId().equals(userId)) return u;
        return null;
    }

    public User getUserByEmail(String email) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM users WHERE email=?")) {
                ps.setString(1, email);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) return mapUser(rs);
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return null;
        }
        for (User u : users) if (u.getEmail() != null && u.getEmail().equals(email)) return u;
        return null;
    }

    public List<User> getAllUsers() {
        if (ok()) {
            List<User> list = new ArrayList<>();
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT * FROM users")) {
                while (rs.next()) list.add(mapUser(rs));
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        return new ArrayList<>(users);
    }

    public void updateUser(User user) { saveUser(user); }

    public void deleteUser(String userId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("DELETE FROM users WHERE id=?")) {
                ps.setString(1, userId);
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            users.removeIf(u -> u.getId().equals(userId));
        }
    }

    private User mapUser(ResultSet rs) throws SQLException {
        User u = new User();
        u.setId(rs.getString("id"));
        u.setEmail(rs.getString("email"));
        u.setName(rs.getString("name"));
        u.setRole(rs.getString("role"));
        u.setUsername(rs.getString("username"));
        u.setUserId(rs.getString("user_id"));
        u.setPasswordHash(rs.getString("password"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) u.setCreatedAt(new java.util.Date(ts.getTime()));
        return u;
    }

    // ─── Project operations ──────────────────────────────────────────

    public void saveProject(Project project) {
        if (ok()) {
            String sql = "INSERT INTO projects (id, name, description, status, priority, dateline, assignee, progress, created_at) VALUES (?,?,?,?,?,?,?,?,NOW()) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, status=EXCLUDED.status, priority=EXCLUDED.priority, dateline=EXCLUDED.dateline, assignee=EXCLUDED.assignee, progress=EXCLUDED.progress";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                ps.setString(1, project.getId());
                ps.setString(2, project.getName());
                ps.setString(3, project.getDescription());
                ps.setString(4, project.getStatus());
                ps.setString(5, project.getPriority());
                ps.setString(6, project.getDateline());
                ps.setString(7, project.getAssignee());
                ps.setFloat(8, project.getProgress());
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            if (!projects.contains(project)) projects.add(project);
        }
    }

    public Project getProjectById(String projectId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM projects WHERE id=?")) {
                ps.setString(1, projectId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) return mapProject(rs);
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return null;
        }
        for (Project p : projects) if (p.getId().equals(projectId)) return p;
        return null;
    }

    public List<Project> getAllProjects() {
        if (ok()) {
            List<Project> list = new ArrayList<>();
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT * FROM projects")) {
                while (rs.next()) list.add(mapProject(rs));
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        return new ArrayList<>(projects);
    }

    public List<Project> getProjectsByStatus(String status) {
        if (ok()) {
            List<Project> list = new ArrayList<>();
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM projects WHERE status=?")) {
                ps.setString(1, status);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapProject(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<Project> result = new ArrayList<>();
        for (Project p : projects) if (p.getStatus() != null && p.getStatus().equals(status)) result.add(p);
        return result;
    }

    public void updateProject(Project project) { saveProject(project); }

    public void deleteProject(String projectId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("DELETE FROM projects WHERE id=?")) {
                ps.setString(1, projectId);
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            projects.removeIf(p -> p.getId().equals(projectId));
        }
    }

    private Project mapProject(ResultSet rs) throws SQLException {
        Project p = new Project();
        p.setId(rs.getString("id"));
        p.setName(rs.getString("name"));
        p.setDescription(rs.getString("description"));
        p.setStatus(rs.getString("status"));
        p.setPriority(rs.getString("priority"));
        p.setDateline(rs.getString("dateline"));
        p.setAssignee(rs.getString("assignee"));
        p.setProgress(rs.getFloat("progress"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) p.setCreatedAt(ts.toInstant().toString());
        return p;
    }

    // ─── Task operations ─────────────────────────────────────────────

    public void saveTask(Task task) {
        if (ok()) {
            String sql = "INSERT INTO tasks (id, title, description, status, priority, due_date, assignee, project_id, created_at) VALUES (?,?,?,?,?,?,?,?,NOW()) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, status=EXCLUDED.status, priority=EXCLUDED.priority, due_date=EXCLUDED.due_date, assignee=EXCLUDED.assignee, project_id=EXCLUDED.project_id";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                ps.setString(1, task.getId());
                ps.setString(2, task.getTitle());
                ps.setString(3, task.getDescription());
                ps.setString(4, task.getStatus());
                ps.setString(5, task.getPriority());
                ps.setString(6, task.getDueDate());
                ps.setString(7, task.getAssignee());
                ps.setString(8, task.getProjectId());
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            if (!tasks.contains(task)) tasks.add(task);
        }
    }

    public Task getTaskById(String taskId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM tasks WHERE id=?")) {
                ps.setString(1, taskId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) return mapTask(rs);
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return null;
        }
        for (Task t : tasks) if (t.getId().equals(taskId)) return t;
        return null;
    }

    public List<Task> getAllTasks() {
        if (ok()) {
            List<Task> list = new ArrayList<>();
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT * FROM tasks")) {
                while (rs.next()) list.add(mapTask(rs));
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        return new ArrayList<>(tasks);
    }

    public List<Task> getTasksByProject(String projectId) {
        if (ok()) {
            List<Task> list = new ArrayList<>();
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM tasks WHERE project_id=?")) {
                ps.setString(1, projectId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapTask(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<Task> result = new ArrayList<>();
        for (Task t : tasks) if (projectId.equals(t.getProjectId())) result.add(t);
        return result;
    }

    public List<Task> getTasksByStatus(String status) {
        if (ok()) {
            List<Task> list = new ArrayList<>();
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM tasks WHERE status=?")) {
                ps.setString(1, status);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapTask(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<Task> result = new ArrayList<>();
        for (Task t : tasks) if (t.getStatus() != null && t.getStatus().equals(status)) result.add(t);
        return result;
    }

    public List<Task> getTasksByAssignee(String assigneeId) {
        if (ok()) {
            List<Task> list = new ArrayList<>();
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM tasks WHERE assignee=?")) {
                ps.setString(1, assigneeId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapTask(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<Task> result = new ArrayList<>();
        for (Task t : tasks) if (assigneeId.equals(t.getAssignee())) result.add(t);
        return result;
    }

    public void updateTask(Task task) { saveTask(task); }

    public void deleteTask(String taskId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("DELETE FROM tasks WHERE id=?")) {
                ps.setString(1, taskId);
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            tasks.removeIf(t -> t.getId().equals(taskId));
        }
    }

    private Task mapTask(ResultSet rs) throws SQLException {
        Task t = new Task();
        t.setId(rs.getString("id"));
        t.setTitle(rs.getString("title"));
        t.setDescription(rs.getString("description"));
        t.setStatus(rs.getString("status"));
        t.setPriority(rs.getString("priority"));
        t.setDueDate(rs.getString("due_date"));
        t.setAssignee(rs.getString("assignee"));
        t.setProjectId(rs.getString("project_id"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) t.setCreatedAt(ts.toInstant().toString());
        return t;
    }

    // ─── Team operations ─────────────────────────────────────────────

    public void saveTeam(Team team) {
        if (ok()) {
            String sql = "INSERT INTO teams (id, name, leader, created_at) VALUES (?,?,?,NOW()) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, leader=EXCLUDED.leader";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                ps.setString(1, team.getId());
                ps.setString(2, team.getName());
                ps.setString(3, team.getLeader());
                ps.executeUpdate();
                updateTeamMembers(team);
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            if (!teams.contains(team)) teams.add(team);
        }
    }

    private void updateTeamMembers(Team team) {
        if (!ok()) return;
        try (PreparedStatement del = c().prepareStatement("DELETE FROM team_members WHERE team_id=?")) {
            del.setString(1, team.getId());
            del.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }

        if (team.getMembers() != null) {
            String sql = "INSERT INTO team_members (team_id, user_id) VALUES (?,?) ON CONFLICT DO NOTHING";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                for (String uid : team.getMembers()) {
                    ps.setString(1, team.getId());
                    ps.setString(2, uid);
                    ps.addBatch();
                }
                ps.executeBatch();
            } catch (SQLException e) { e.printStackTrace(); }
        }
    }

    public Team getTeamById(String teamId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM teams WHERE id=?")) {
                ps.setString(1, teamId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) return mapTeam(rs);
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return null;
        }
        for (Team t : teams) if (t.getId().equals(teamId)) return t;
        return null;
    }

    public List<Team> getAllTeams() {
        if (ok()) {
            List<Team> list = new ArrayList<>();
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT * FROM teams")) {
                while (rs.next()) list.add(mapTeam(rs));
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        return new ArrayList<>(teams);
    }

    public void updateTeam(Team team) { saveTeam(team); }

    public void deleteTeam(String teamId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("DELETE FROM teams WHERE id=?")) {
                ps.setString(1, teamId);
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            teams.removeIf(t -> t.getId().equals(teamId));
        }
    }

    private Team mapTeam(ResultSet rs) throws SQLException {
        Team t = new Team();
        t.setId(rs.getString("id"));
        t.setName(rs.getString("name"));
        t.setLeader(rs.getString("leader"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) t.setCreatedAt(new java.util.Date(ts.getTime()));
        t.setMembers(getTeamMemberIds(t.getId()));
        return t;
    }

    private List<String> getTeamMemberIds(String teamId) {
        List<String> members = new ArrayList<>();
        try (PreparedStatement ps = c().prepareStatement("SELECT user_id FROM team_members WHERE team_id=?")) {
            ps.setString(1, teamId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) members.add(rs.getString("user_id"));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return members;
    }

    // ─── Notification operations ─────────────────────────────────────

    public void saveNotification(Notification notification) {
        if (ok()) {
            String sql = "INSERT INTO notifications (id, message, type, user_id, is_read, related_task_id, created_at) VALUES (?,?,?,?,?,?,NOW()) ON CONFLICT (id) DO UPDATE SET is_read=EXCLUDED.is_read";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                ps.setString(1, notification.getId());
                ps.setString(2, notification.getMessage());
                ps.setString(3, notification.getType());
                ps.setString(4, notification.getUserId());
                ps.setBoolean(5, notification.isRead());
                ps.setString(6, notification.getRelatedTaskId());
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            if (!notifications.contains(notification)) notifications.add(notification);
        }
    }

    public List<Notification> getNotificationsByUser(String userId) {
        if (ok()) {
            List<Notification> list = new ArrayList<>();
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC")) {
                ps.setString(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapNotification(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<Notification> result = new ArrayList<>();
        for (Notification n : notifications) if (userId.equals(n.getUserId())) result.add(n);
        return result;
    }

    public List<Notification> getUnreadNotifications(String userId) {
        if (ok()) {
            List<Notification> list = new ArrayList<>();
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM notifications WHERE user_id=? AND is_read=false ORDER BY created_at DESC")) {
                ps.setString(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapNotification(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<Notification> result = new ArrayList<>();
        for (Notification n : notifications) if (userId.equals(n.getUserId()) && !n.isRead()) result.add(n);
        return result;
    }

    public void markAsRead(String notificationId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("UPDATE notifications SET is_read=true WHERE id=?")) {
                ps.setString(1, notificationId);
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            for (Notification n : notifications) if (n.getId().equals(notificationId)) { n.setRead(true); break; }
        }
    }

    public void deleteNotification(String notificationId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("DELETE FROM notifications WHERE id=?")) {
                ps.setString(1, notificationId);
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            notifications.removeIf(n -> n.getId().equals(notificationId));
        }
    }

    public Notification getNotificationById(String notificationId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM notifications WHERE id=?")) {
                ps.setString(1, notificationId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) return mapNotification(rs);
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return null;
        }
        for (Notification n : notifications) if (n.getId().equals(notificationId)) return n;
        return null;
    }

    private Notification mapNotification(ResultSet rs) throws SQLException {
        Notification n = new Notification();
        n.setId(rs.getString("id"));
        n.setMessage(rs.getString("message"));
        n.setType(rs.getString("type"));
        n.setUserId(rs.getString("user_id"));
        n.setRead(rs.getBoolean("is_read"));
        n.setRelatedTaskId(rs.getString("related_task_id"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) n.setTimestamp(ts.toString());
        return n;
    }

    // ─── Comment operations ──────────────────────────────────────────

    public void saveComment(Comment comment) {
        if (ok()) {
            String sql = "INSERT INTO comments (id, text, author, task_id, project_id, data, created_at) VALUES (?,?,?,?,?,?,NOW()) ON CONFLICT (id) DO UPDATE SET text=EXCLUDED.text, data=EXCLUDED.data";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                ps.setString(1, comment.getId());
                ps.setString(2, comment.getText());
                ps.setString(3, comment.getAuthor());
                ps.setString(4, comment.getTaskId());
                ps.setString(5, comment.getProjectId());
                ps.setString(6, comment.getData());
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            if (!comments.contains(comment)) comments.add(comment);
        }
    }

    public List<Comment> getCommentsByTask(String taskId) {
        if (ok()) {
            List<Comment> list = new ArrayList<>();
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM comments WHERE task_id=? ORDER BY created_at ASC")) {
                ps.setString(1, taskId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapComment(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<Comment> list = new ArrayList<>();
        for (Comment c : comments) if (c.getTaskId() != null && c.getTaskId().equals(taskId)) list.add(c);
        return list;
    }

    public Comment getCommentById(String commentId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM comments WHERE id=?")) {
                ps.setString(1, commentId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) return mapComment(rs);
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return null;
        }
        for (Comment c : comments) if (c.getId().equals(commentId)) return c;
        return null;
    }

    public void updateComment(Comment comment) { saveComment(comment); }

    public void deleteComment(String commentId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("DELETE FROM comments WHERE id=?")) {
                ps.setString(1, commentId);
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            comments.removeIf(c -> c.getId().equals(commentId));
        }
    }

    private Comment mapComment(ResultSet rs) throws SQLException {
        Comment c = new Comment();
        c.setId(rs.getString("id"));
        c.setText(rs.getString("text"));
        c.setAuthor(rs.getString("author"));
        c.setTaskId(rs.getString("task_id"));
        c.setProjectId(rs.getString("project_id"));
        c.setData(rs.getString("data"));
        return c;
    }

    // ─── File operations ─────────────────────────────────────────────

    public void saveFile(File file) {
        if (ok()) {
            String sql = "INSERT INTO files (id, file_name, url, type, uploaded_by, project_id, uploaded_at, comment) VALUES (?,?,?,?,?,?,NOW(),?) ON CONFLICT (id) DO UPDATE SET file_name=EXCLUDED.file_name, url=EXCLUDED.url, type=EXCLUDED.type, comment=EXCLUDED.comment";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                ps.setString(1, file.getId());
                ps.setString(2, file.getFilename());
                ps.setString(3, file.getUrl());
                ps.setString(4, file.getType());
                ps.setString(5, file.getUploadedBy());
                ps.setString(6, file.getProjectId());
                ps.setString(7, file.getComment());
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            if (!files.contains(file)) files.add(file);
        }
    }

    public File getFileById(String fileId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM files WHERE id=?")) {
                ps.setString(1, fileId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) return mapFile(rs);
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return null;
        }
        for (File f : files) if (f.getId().equals(fileId)) return f;
        return null;
    }

    public List<File> getAllFiles() {
        if (ok()) {
            List<File> list = new ArrayList<>();
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT * FROM files")) {
                while (rs.next()) list.add(mapFile(rs));
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        return new ArrayList<>(files);
    }

    public void deleteFile(String fileId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("DELETE FROM files WHERE id=?")) {
                ps.setString(1, fileId);
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            files.removeIf(f -> f.getId().equals(fileId));
        }
    }

    private File mapFile(ResultSet rs) throws SQLException {
        File f = new File();
        f.setId(rs.getString("id"));
        f.setFilename(rs.getString("file_name"));
        f.setUrl(rs.getString("url"));
        f.setType(rs.getString("type"));
        f.setUploadedBy(rs.getString("uploaded_by"));
        f.setProjectId(rs.getString("project_id"));
        Timestamp ts = rs.getTimestamp("uploaded_at");
        if (ts != null) f.setUploadedAt(new java.util.Date(ts.getTime()));
        return f;
    }

    // ─── Message operations ──────────────────────────────────────────

    public void saveMessage(Message message) {
        if (ok()) {
            String sql = "INSERT INTO messages (id, sender_id, receiver_id, content, sent_at, project_id) VALUES (?,?,?,?,NOW(),?)";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                ps.setString(1, message.getId());
                ps.setString(2, message.getSenderId());
                ps.setString(3, message.getReceiverId());
                ps.setString(4, message.getContent());
                ps.setString(5, message.getProjectId());
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            if (!messages.contains(message)) messages.add(message);
        }
    }

    public List<Message> getMessagesBetween(String userId1, String userId2) {
        if (ok()) {
            List<Message> list = new ArrayList<>();
            String sql = "SELECT * FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY sent_at ASC";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                ps.setString(1, userId1);
                ps.setString(2, userId2);
                ps.setString(3, userId2);
                ps.setString(4, userId1);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapMessage(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<Message> result = new ArrayList<>();
        for (Message m : messages) {
            if ((userId1.equals(m.getSenderId()) && userId2.equals(m.getReceiverId())) ||
                (userId2.equals(m.getSenderId()) && userId1.equals(m.getReceiverId()))) {
                result.add(m);
            }
        }
        return result;
    }

    public List<Message> getMessagesByProject(String projectId) {
        if (ok()) {
            List<Message> list = new ArrayList<>();
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM messages WHERE project_id=? ORDER BY sent_at ASC")) {
                ps.setString(1, projectId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapMessage(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<Message> result = new ArrayList<>();
        for (Message m : messages) if (projectId.equals(m.getProjectId())) result.add(m);
        return result;
    }

    public void deleteMessage(String messageId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("DELETE FROM messages WHERE id=?")) {
                ps.setString(1, messageId);
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            messages.removeIf(m -> m.getId().equals(messageId));
        }
    }

    private Message mapMessage(ResultSet rs) throws SQLException {
        Message m = new Message();
        m.setId(rs.getString("id"));
        m.setSenderId(rs.getString("sender_id"));
        m.setReceiverId(rs.getString("receiver_id"));
        m.setContent(rs.getString("content"));
        Timestamp ts = rs.getTimestamp("sent_at");
        if (ts != null) m.setSentAt(ts.toInstant().toString());
        m.setProjectId(rs.getString("project_id"));
        return m;
    }

    // ─── Milestone operations ────────────────────────────────────────

    public void saveMilestone(Milestone milestone) {
        if (ok()) {
            String sql = "INSERT INTO milestones (id, name, deadline, project_id, status) VALUES (?,?,?,?,?) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, deadline=EXCLUDED.deadline, status=EXCLUDED.status";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                ps.setString(1, milestone.getId());
                ps.setString(2, milestone.getName());
                ps.setString(3, milestone.getDeadline());
                ps.setString(4, milestone.getProjectId());
                ps.setString(5, milestone.getStatus());
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            if (!milestones.contains(milestone)) milestones.add(milestone);
        }
    }

    public List<Milestone> getMilestonesByProject(String projectId) {
        if (ok()) {
            List<Milestone> list = new ArrayList<>();
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM milestones WHERE project_id=? ORDER BY deadline ASC")) {
                ps.setString(1, projectId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapMilestone(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<Milestone> result = new ArrayList<>();
        for (Milestone m : milestones) if (projectId.equals(m.getProjectId())) result.add(m);
        return result;
    }

    public void deleteMilestone(String milestoneId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("DELETE FROM milestones WHERE id=?")) {
                ps.setString(1, milestoneId);
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            milestones.removeIf(m -> m.getId().equals(milestoneId));
        }
    }

    private Milestone mapMilestone(ResultSet rs) throws SQLException {
        Milestone m = new Milestone();
        m.setId(rs.getString("id"));
        m.setName(rs.getString("name"));
        m.setDeadline(rs.getString("deadline"));
        m.setProjectId(rs.getString("project_id"));
        m.setStatus(rs.getString("status"));
        return m;
    }

    // ─── Activity Log operations ─────────────────────────────────────

    public void saveActivityLog(ActivityLog log) {
        if (ok()) {
            String sql = "INSERT INTO activity_log (id, user_id, action, timestamp, project_id) VALUES (?,?,?,NOW(),?)";
            try (PreparedStatement ps = c().prepareStatement(sql)) {
                ps.setString(1, log.getId());
                ps.setString(2, log.getUserId());
                ps.setString(3, log.getAction());
                ps.setString(4, log.getProjectId());
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            if (!activityLogs.contains(log)) activityLogs.add(log);
        }
    }

    public List<ActivityLog> getActivityLogsByUser(String userId) {
        if (ok()) {
            List<ActivityLog> list = new ArrayList<>();
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM activity_log WHERE user_id=? ORDER BY timestamp DESC")) {
                ps.setString(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapActivityLog(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<ActivityLog> result = new ArrayList<>();
        for (ActivityLog a : activityLogs) if (userId.equals(a.getUserId())) result.add(a);
        return result;
    }

    public List<ActivityLog> getActivityLogsByProject(String projectId) {
        if (ok()) {
            List<ActivityLog> list = new ArrayList<>();
            try (PreparedStatement ps = c().prepareStatement("SELECT * FROM activity_log WHERE project_id=? ORDER BY timestamp DESC")) {
                ps.setString(1, projectId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapActivityLog(rs));
                }
            } catch (SQLException e) { e.printStackTrace(); }
            return list;
        }
        List<ActivityLog> result = new ArrayList<>();
        for (ActivityLog a : activityLogs) if (projectId.equals(a.getProjectId())) result.add(a);
        return result;
    }

    private ActivityLog mapActivityLog(ResultSet rs) throws SQLException {
        ActivityLog a = new ActivityLog();
        a.setId(rs.getString("id"));
        a.setUserId(rs.getString("user_id"));
        a.setAction(rs.getString("action"));
        Timestamp ts = rs.getTimestamp("timestamp");
        if (ts != null) a.setTimestamp(ts.toInstant().toString());
        a.setProjectId(rs.getString("project_id"));
        return a;
    }

    // ─── Generic operations ──────────────────────────────────────────

    public void save() { System.out.println("Data saved successfully."); }
    public void update() { System.out.println("Data updated successfully."); }
    public void delete() {
        users.clear(); projects.clear(); tasks.clear(); teams.clear();
        notifications.clear(); comments.clear(); files.clear();
        messages.clear(); milestones.clear(); activityLogs.clear();
        System.out.println("All data deleted.");
    }
    public void query() { System.out.println("Query executed successfully."); }

    // ─── UML Aliases ─────────────────────────────────────────────────

    public List<Object> SELECT_PROCESS(String Userid) {
        List<Object> result = new ArrayList<>();
        result.addAll(getAllProjects());
        return result;
    }

    public List<Object> SELECT_TASK(String Processid) {
        List<Object> result = new ArrayList<>();
        result.addAll(getTasksByProject(Processid));
        return result;
    }

    public List<Object> SELECT_TASK_WITH_STATUS(String Userid) {
        List<Object> result = new ArrayList<>();
        result.addAll(getTasksByAssignee(Userid));
        return result;
    }

    public List<Object> SELECT_RECENT_ACTIVITIES(String Userid) {
        List<Object> result = new ArrayList<>();
        result.addAll(getNotificationsByUser(Userid));
        return result;
    }

    public List<Object> SELECT_USER_TASKS(String Userid) {
        List<Object> result = new ArrayList<>();
        result.addAll(getTasksByAssignee(Userid));
        return result;
    }

    // ─── Statistics ──────────────────────────────────────────────────

    public int getTotalProjects() {
        if (ok()) {
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM projects")) {
                if (rs.next()) return rs.getInt(1);
            } catch (SQLException e) { e.printStackTrace(); }
        }
        return projects.size();
    }

    public int getTotalTasks() {
        if (ok()) {
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM tasks")) {
                if (rs.next()) return rs.getInt(1);
            } catch (SQLException e) { e.printStackTrace(); }
        }
        return tasks.size();
    }

    public int getTotalUsers() {
        if (ok()) {
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM users")) {
                if (rs.next()) return rs.getInt(1);
            } catch (SQLException e) { e.printStackTrace(); }
        }
        return users.size();
    }

    public int getCompletedTasks() {
        if (ok()) {
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM tasks WHERE status='done'")) {
                if (rs.next()) return rs.getInt(1);
            } catch (SQLException e) { e.printStackTrace(); }
        }
        int count = 0;
        for (Task t : tasks) if (t.getStatus() != null && t.getStatus().equals("done")) count++;
        return count;
    }

    public int getInProgressTasks() {
        if (ok()) {
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM tasks WHERE status='inprogress'")) {
                if (rs.next()) return rs.getInt(1);
            } catch (SQLException e) { e.printStackTrace(); }
        }
        int count = 0;
        for (Task t : tasks) if (t.getStatus() != null && t.getStatus().equals("inprogress")) count++;
        return count;
    }

    public int getTodoTasks() {
        if (ok()) {
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM tasks WHERE status='todo'")) {
                if (rs.next()) return rs.getInt(1);
            } catch (SQLException e) { e.printStackTrace(); }
        }
        int count = 0;
        for (Task t : tasks) if (t.getStatus() != null && t.getStatus().equals("todo")) count++;
        return count;
    }

    public int getOnHoldTasks() {
        if (ok()) {
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM tasks WHERE status='paused'")) {
                if (rs.next()) return rs.getInt(1);
            } catch (SQLException e) { e.printStackTrace(); }
        }
        int count = 0;
        for (Task t : tasks) if (t.getStatus() != null && t.getStatus().equals("paused")) count++;
        return count;
    }

    public int getTotalFiles() {
        if (ok()) {
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM files")) {
                if (rs.next()) return rs.getInt(1);
            } catch (SQLException e) { e.printStackTrace(); }
        }
        return files.size();
    }

    public int getTotalTeams() {
        if (ok()) {
            try (Statement stmt = c().createStatement(); ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM teams")) {
                if (rs.next()) return rs.getInt(1);
            } catch (SQLException e) { e.printStackTrace(); }
        }
        return teams.size();
    }

    public void markAllAsRead(String userId) {
        if (ok()) {
            try (PreparedStatement ps = c().prepareStatement("UPDATE notifications SET is_read=true WHERE user_id=?")) {
                ps.setString(1, userId);
                ps.executeUpdate();
            } catch (SQLException e) { e.printStackTrace(); }
        } else {
            for (Notification n : notifications) if (userId.equals(n.getUserId())) n.setRead(true);
        }
    }

    public void notify(String userId, String message, String type, String relatedTaskId) {
        if (userId == null || userId.isEmpty() || message == null) return;
        Notification n = new Notification(message, type != null ? type : "info");
        n.setUserId(userId);
        n.setRelatedTaskId(relatedTaskId);
        n.setRead(false);
        saveNotification(n);
    }
}
