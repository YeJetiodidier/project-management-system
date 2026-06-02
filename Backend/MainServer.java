import com.sun.net.httpserver.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;

/**
 * MainServer - HTTP entry point of the project management backend.
 *
 * OOP Concepts Demonstrated:
 *  - INTERFACES: Every inner handler class implements
 *    com.sun.net.httpserver.HttpHandler and overrides its handle()
 *    method. The HttpServer accepts any HttpHandler implementation,
 *    so the type bound is the interface, not a concrete class.
 *  - INHERITANCE: The nested classes are static inner classes of
 *    MainServer. They implicitly inherit access to MainServer's
 *    private helpers (setCorsHeaders, sendJson, sendError, etc.).
 *  - POLYMORPHISM: All handlers implement the same HttpHandler
 *    interface but each provides a different handle() implementation.
 *    HttpServer calls them through the interface reference, so the
 *    correct version is selected at runtime (dynamic polymorphism).
 *  - EXCEPTION HANDLING: main() declares 'throws Exception' so
 *    IOException and other I/O problems bubble up cleanly. Several
 *    handlers use try-with-resources when streaming the response
 *    body, and 'throws IOException' on their handle() signature.
 *  - ENCAPSULATION: 'db' and 'sessions' are private static — only the
 *    MainServer class (and its inner classes) can touch them.
 */
public class MainServer {
    // ─── ENCAPSULATION ───────────────────────────────────────────────
    // Both fields are private and static. The Database instance and the
    // session map are shared by all the inner handler classes below,
    // but they cannot be reached from outside MainServer.
    private static Database db = new Database();
    private static Map<String, String> sessions = new HashMap<>();

    // ─── EXCEPTION HANDLING ──────────────────────────────────────────
    // 'throws Exception' on main() lets any uncaught I/O or runtime
    // problem propagate to the JVM, which is fine for a simple server.
    public static void main(String[] args) throws Exception {
        setupDummyData();

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // ─── INTERFACES + POLYMORPHISM ───────────────────────────────
        // server.createContext() takes an HttpHandler — the interface.
        // The eight handler instances below are all of different
        // concrete types, but they are passed through the same
        // interface. At runtime the JVM dispatches each request to
        // the correct handle() implementation.
        server.createContext("/", new StaticFileHandler());
        server.createContext("/api/auth/login", new AuthHandler());
        server.createContext("/api/auth/register", new RegisterHandler());
        server.createContext("/api/projects", new ProjectsHandler());
        server.createContext("/api/tasks", new TasksHandler());
        server.createContext("/api/teams", new TeamsHandler());
        server.createContext("/api/notifications", new NotificationsHandler());
        server.createContext("/api/files", new FilesHandler());
        server.createContext("/api/comments", new CommentsHandler());
        server.createContext("/api/users", new UsersHandler());
        server.createContext("/api/dashboard", new DashboardHandler());

        server.setExecutor(null);
        server.start();
        System.out.println("Server started on port 8080 \u2192 http://localhost:8080/");
    }

    private static void setupDummyData() {
        User manager = new User("admin@test.com", "Admin", "manager");
        manager.setUsername("admin");
        manager.setPassword("admin123");
        User member = new User("user@test.com", "User", "member");
        member.setUserId("123");
        member.setPassword("user123");
        db.saveUser(manager);
        db.saveUser(member);
    }

    private static void setCorsHeaders(HttpExchange t) {
        t.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        t.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        t.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    // ─── EXCEPTION HANDLING ──────────────────────────────────────────
    // try-with-resources closes the response OutputStream even if an
    // IOException is thrown while writing the body. The 'throws
    // IOException' clause forces callers to acknowledge the failure.
    private static void sendJson(HttpExchange t, int code, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        t.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        t.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = t.getResponseBody()) { os.write(bytes); }
    }

    private static void sendError(HttpExchange t, int code, String message) throws IOException {
        sendJson(t, code, "{\"message\":\"" + message.replace("\"", "\\\"") + "\"}");
    }

    private static String getAuthToken(HttpExchange t) {
        List<String> auth = t.getRequestHeaders().get("Authorization");
        if (auth != null && !auth.isEmpty()) {
            String header = auth.get(0);
            if (header.startsWith("Bearer ")) {
                return header.substring(7).trim();
            }
        }
        String query = t.getRequestURI().getQuery();
        if (query != null) {
            for (String part : query.split("&")) {
                if (part.startsWith("token=")) return part.substring(6);
            }
        }
        return null;
    }

    private static User authenticate(HttpExchange t) throws IOException {
        String token = getAuthToken(t);
        if (token == null || token.isEmpty()) {
            sendError(t, 401, "Unauthorized");
            return null;
        }
        String userId = sessions.get(token);
        if (userId == null) {
            sendError(t, 401, "Unauthorized");
            return null;
        }
        User user = db.getUserById(userId);
        if (user == null) {
            sendError(t, 401, "Unauthorized");
            return null;
        }
        return user;
    }

    private static boolean authorizeManager(HttpExchange t, User user) throws IOException {
        if (user == null || !"manager".equals(user.getRole())) {
            sendError(t, 403, "Forbidden");
            return false;
        }
        return true;
    }

    private static boolean canViewProject(User user, Project project) {
        if (project == null) return false;
        if (user == null) return false;
        if ("manager".equals(user.getRole())) return true;
        if (project.getAssignee() != null && project.getAssignee().equals(user.getId())) return true;
        for (Task t : db.getTasksByProject(project.getId())) {
            if (user.getId().equals(t.getAssignee())) return true;
        }
        return false;
    }

    static class StaticFileHandler implements HttpHandler {
        // ─── INTERFACES + POLYMORPHISM + EXCEPTION HANDLING ─────────
        // Implements the HttpHandler interface. The 'throws IOException'
        // clause is part of the interface contract; any failure while
        // reading the file or writing the response propagates up.
        @Override
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);
            if ("OPTIONS".equals(t.getRequestMethod())) { t.sendResponseHeaders(204, -1); return; }

            String path = t.getRequestURI().getPath();
            if (path.equals("/")) path = "/index.html";

            java.io.File root = new java.io.File("../frontend").getCanonicalFile();
            java.io.File file = new java.io.File(root, path).getCanonicalFile();

            if (!file.getPath().startsWith(root.getPath())) {
                t.sendResponseHeaders(403, 0); t.getResponseBody().close(); return;
            }
            if (!file.exists() || file.length() == 0) {
                t.sendResponseHeaders(404, 0); t.getResponseBody().close(); return;
            }

            String mime = "text/plain";
            if (path.endsWith(".html")) mime = "text/html; charset=utf-8";
            else if (path.endsWith(".css")) mime = "text/css";
            else if (path.endsWith(".js")) mime = "application/javascript";
            else if (path.endsWith(".png")) mime = "image/png";
            else if (path.endsWith(".svg")) mime = "image/svg+xml";
            else if (path.endsWith(".ico")) mime = "image/x-icon";

            t.getResponseHeaders().set("Content-Type", mime);
            t.sendResponseHeaders(200, file.length());
            // try-with-resources: the OutputStream is closed even on
            // an exception during the copy.
            try (OutputStream os = t.getResponseBody()) { Files.copy(file.toPath(), os); }
        }
    }

    // ─── INTERFACES + POLYMORPHISM + INHERITANCE ─────────────────────
    // The handler classes below are all 'static' nested classes of
    // MainServer. As nested classes they implicitly inherit access
    // to MainServer's private helpers (sendJson, sendError, etc.).
    // As HttpHandler implementers, they commit to providing a
    // handle(HttpExchange) method — that contract is what lets the
    // HttpServer call them polymorphically.
    // ─── Auth ────────────────────────────────────────────────────────

    static class AuthHandler implements HttpHandler {
        // ─── POLYMORPHISM (Method Overriding) ────────────────────────
        // The @Override annotation tells the compiler this handle()
        // method replaces the one declared in the HttpHandler
        // interface. This is the runtime polymorphism in action:
        // HttpServer calls handle(...) through the interface, and
        // each handler's version runs.
        @Override
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);
            if ("OPTIONS".equals(t.getRequestMethod())) { t.sendResponseHeaders(204, -1); return; }
            if (!"POST".equals(t.getRequestMethod())) { t.sendResponseHeaders(405, -1); return; }

            Map<String, String> payload = ApiHandler.parseJson(ApiHandler.readStream(t.getRequestBody()));
            String email = payload.get("email");
            String password = payload.get("password");

            if (email == null || email.isEmpty() || password == null || password.isEmpty()) {
                sendError(t, 400, "Email and password are required");
                return;
            }

            User matchedUser = null;
            for (User u : db.getAllUsers()) {
                if (u.login(email, password)) { matchedUser = u; break; }
            }

            if (matchedUser != null) {
                String token = "pms-token-" + UUID.randomUUID().toString();
                sessions.put(token, matchedUser.getId());
                Map<String, String> res = new LinkedHashMap<>();
                res.put("token", token);
                res.put("id", matchedUser.getId());
                res.put("userId", matchedUser.getUserId() != null ? matchedUser.getUserId() : matchedUser.getId());
                res.put("username", matchedUser.getUsername() != null ? matchedUser.getUsername() : matchedUser.getName());
                res.put("name", matchedUser.getName());
                res.put("email", matchedUser.getEmail());
                res.put("role", matchedUser.getRole());
                sendJson(t, 200, ApiHandler.toJson(res));
            } else {
                sendError(t, 401, "Invalid email or password");
            }
        }
    }

    static class RegisterHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);
            if ("OPTIONS".equals(t.getRequestMethod())) { t.sendResponseHeaders(204, -1); return; }
            if (!"POST".equals(t.getRequestMethod())) { t.sendResponseHeaders(405, -1); return; }

            Map<String, String> payload = ApiHandler.parseJson(ApiHandler.readStream(t.getRequestBody()));
            String email = payload.get("email");
            String username = payload.get("username");
            String password = payload.get("password");
            String role = payload.getOrDefault("role", "member");

            if (email == null || email.isEmpty() || username == null || username.isEmpty() || password == null || password.isEmpty()) {
                sendError(t, 400, "Email, username and password are required");
                return;
            }
            if (db.getUserByEmail(email) != null) {
                sendError(t, 409, "Email already registered");
                return;
            }

            User user = new User(email, username, role);
            user.register(email, username, password, "member", payload.get("projectId") != null ? payload.get("projectId") : username);
            db.saveUser(user);
            sendJson(t, 201, "{\"message\":\"Account created successfully\"}");
        }
    }

    // ─── Projects ────────────────────────────────────────────────────

    static class ProjectsHandler implements HttpHandler {
        // ─── POLYMORPHISM (Method Overriding) ────────────────────────
        // Same interface, different implementation. HttpServer
        // polymorphically dispatches to this version of handle().
        @Override
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);
            if ("OPTIONS".equals(t.getRequestMethod())) { t.sendResponseHeaders(204, -1); return; }

            User currentUser = authenticate(t);
            if (currentUser == null) return;

            if ("GET".equals(t.getRequestMethod())) {
                String query = t.getRequestURI().getQuery();
                if (query != null && query.startsWith("id=")) {
                    Project p = db.getProjectById(query.substring(3));
                    if (p == null) { sendError(t, 404, "Not found"); return; }
                    if (!canViewProject(currentUser, p)) { sendError(t, 403, "Forbidden"); return; }
                    sendJson(t, 200, ApiHandler.toJson(p));
                } else {
                    List<Project> all = db.getAllProjects();
                    if ("manager".equals(currentUser.getRole())) {
                        sendJson(t, 200, ApiHandler.toJson(all));
                        return;
                    }
                    List<Project> visible = new ArrayList<>();
                    for (Project project : all) {
                        if (canViewProject(currentUser, project)) visible.add(project);
                    }
                    sendJson(t, 200, ApiHandler.toJson(visible));
                }
            } else if ("POST".equals(t.getRequestMethod())) {
                if (!authorizeManager(t, currentUser)) return;
                Map<String, String> p = ApiHandler.parseJson(ApiHandler.readStream(t.getRequestBody()));
                String id = p.getOrDefault("id", "");
                Project project = db.getProjectById(id);
                if (project != null) {
                    if (p.containsKey("name"))        project.setName(p.get("name"));
                    if (p.containsKey("description"))  project.setDescription(p.get("description"));
                    if (p.containsKey("status"))       project.setStatus(p.get("status"));
                    if (p.containsKey("priority"))     project.setPriority(p.get("priority"));
                    if (p.containsKey("dateline"))     project.setDateline(p.get("dateline"));
                    if (p.containsKey("assignee"))     project.setAssignee(p.get("assignee"));
                    db.updateProject(project);
                    sendJson(t, 200, ApiHandler.toJson(project));
                } else {
                    Project np = new Project(p.get("name"), p.get("description"), p.get("status"), p.get("priority"), p.get("dateline"));
                    if (p.containsKey("assignee")) np.setAssignee(p.get("assignee"));
                    db.saveProject(np);
                    if (np.getAssignee() != null && !np.getAssignee().isEmpty()) {
                        db.notify(np.getAssignee(),
                            "You were assigned to project: " + np.getName(),
                            "project", null);
                    }
                    sendJson(t, 200, ApiHandler.toJson(np));
                }
            } else if ("DELETE".equals(t.getRequestMethod())) {
                if (!authorizeManager(t, currentUser)) return;
                String q = t.getRequestURI().getQuery();
                if (q != null && q.startsWith("id=")) db.deleteProject(q.substring(3));
                sendJson(t, 200, "{\"ok\":true}");
            } else {
                t.sendResponseHeaders(405, -1);
            }
        }
    }

    // ─── Tasks ───────────────────────────────────────────────────────

    static class TasksHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);
            if ("OPTIONS".equals(t.getRequestMethod())) { t.sendResponseHeaders(204, -1); return; }

            User currentUser = authenticate(t);
            if (currentUser == null) return;

            if ("GET".equals(t.getRequestMethod())) {
                String query = t.getRequestURI().getQuery();
                if (query != null) {
                    if (query.startsWith("id=")) {
                        Task task = db.getTaskById(query.substring(3));
                        if (task == null) { sendError(t, 404, "Not found"); return; }
                        if (!"manager".equals(currentUser.getRole()) && !currentUser.getId().equals(task.getAssignee())) {
                            sendError(t, 403, "Forbidden"); return;
                        }
                        sendJson(t, 200, ApiHandler.toJson(task));
                    } else if (query.startsWith("projectId=")) {
                        String projectId = query.substring(10);
                        List<Task> list = db.getTasksByProject(projectId);
                        if (!"manager".equals(currentUser.getRole())) {
                            list.removeIf(task -> !currentUser.getId().equals(task.getAssignee()));
                        }
                        sendJson(t, 200, ApiHandler.toJson(list));
                    } else if (query.startsWith("assignee=")) {
                        String assignee = query.substring(9);
                        if ("member".equals(currentUser.getRole()) && !assignee.equals(currentUser.getId())) {
                            sendError(t, 403, "Forbidden"); return;
                        }
                        sendJson(t, 200, ApiHandler.toJson(db.getTasksByAssignee(assignee)));
                    } else {
                        t.sendResponseHeaders(400, -1);
                    }
                } else {
                    if ("manager".equals(currentUser.getRole())) {
                        sendJson(t, 200, ApiHandler.toJson(db.getAllTasks()));
                    } else {
                        sendJson(t, 200, ApiHandler.toJson(db.getTasksByAssignee(currentUser.getId())));
                    }
                }
            } else if ("POST".equals(t.getRequestMethod())) {
                Map<String, String> p = ApiHandler.parseJson(ApiHandler.readStream(t.getRequestBody()));
                String id = p.getOrDefault("id", "");
                Task task = id.isEmpty() ? null : db.getTaskById(id);
                if (task != null) {
                    boolean isManager = "manager".equals(currentUser.getRole());
                    if (!isManager && !currentUser.getId().equals(task.getAssignee())) {
                        sendError(t, 403, "Forbidden"); return;
                    }
                    String prevStatus = task.getStatus();
                    if (p.containsKey("title") && isManager)       task.setTitle(p.get("title"));
                    if (p.containsKey("description") && isManager) task.setDescription(p.get("description"));
                    if (p.containsKey("priority") && isManager)    task.setPriority(p.get("priority"));
                    if (p.containsKey("dueDate") && isManager)     task.setDueDate(p.get("dueDate"));
                    if (p.containsKey("assignee") && isManager)    task.setAssignee(p.get("assignee"));
                    if (p.containsKey("projectId") && isManager)   task.setProjectId(p.get("projectId"));
                    if (p.containsKey("status"))                   task.setStatus(p.get("status"));
                    db.updateTask(task);
                    if (!"done".equals(prevStatus) && "done".equals(task.getStatus())) {
                        Project pj = db.getProjectById(task.getProjectId());
                        if (pj != null && pj.getAssignee() != null && !pj.getAssignee().isEmpty()) {
                            db.notify(pj.getAssignee(),
                                "Task \"" + task.getTitle() + "\" was marked done",
                                "task_done", task.getId());
                        }
                    }
                    sendJson(t, 200, ApiHandler.toJson(task));
                } else {
                    if (!authorizeManager(t, currentUser)) return;
                    Task nt = new Task(p.get("title"), p.get("description"), p.get("status"), p.get("priority"), p.get("dueDate"));
                    if (p.containsKey("assignee"))  nt.setAssignee(p.get("assignee"));
                    if (p.containsKey("projectId")) nt.setProjectId(p.get("projectId"));
                    db.saveTask(nt);
                    if (nt.getAssignee() != null && !nt.getAssignee().isEmpty()) {
                        db.notify(nt.getAssignee(),
                            "New task assigned: " + nt.getTitle(),
                            "task", nt.getId());
                    }
                    sendJson(t, 200, ApiHandler.toJson(nt));
                }
            } else if ("DELETE".equals(t.getRequestMethod())) {
                if (!authorizeManager(t, currentUser)) return;
                String q = t.getRequestURI().getQuery();
                if (q != null && q.startsWith("id=")) db.deleteTask(q.substring(3));
                sendJson(t, 200, "{\"ok\":true}");
            } else {
                t.sendResponseHeaders(405, -1);
            }
        }
    }

    // ─── Teams ───────────────────────────────────────────────────────

    static class TeamsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);
            if ("OPTIONS".equals(t.getRequestMethod())) { t.sendResponseHeaders(204, -1); return; }

            User currentUser = authenticate(t);
            if (currentUser == null) return;

            if ("GET".equals(t.getRequestMethod())) {
                if ("manager".equals(currentUser.getRole())) {
                    sendJson(t, 200, ApiHandler.toJson(db.getAllTeams()));
                    return;
                }
                List<Team> allowed = new ArrayList<>();
                for (Team team : db.getAllTeams()) {
                    if (currentUser.getId().equals(team.getLeader()) || (team.getMembers() != null && team.getMembers().contains(currentUser.getId()))) {
                        allowed.add(team);
                    }
                }
                sendJson(t, 200, ApiHandler.toJson(allowed));
            } else if ("POST".equals(t.getRequestMethod())) {
                if (!authorizeManager(t, currentUser)) return;
                Map<String, String> p = ApiHandler.parseJson(ApiHandler.readStream(t.getRequestBody()));
                String id = p.getOrDefault("id", "");
                Team team = db.getTeamById(id);
                if (team != null) {
                    if (p.containsKey("name"))   team.setName(p.get("name"));
                    if (p.containsKey("leader")) team.setLeader(p.get("leader"));
                    db.updateTeam(team);
                    sendJson(t, 200, ApiHandler.toJson(team));
                } else {
                    Team nt = new Team(p.get("name"), p.get("leader"));
                    if (p.containsKey("members")) {
                        String raw = p.get("members").trim();
                        raw = raw.replaceAll("^\\[|\\]$", "");
                        List<String> members = new ArrayList<>();
                        for (String item : raw.split(",")) {
                            String clean = item.trim().replaceAll("^\"|\"$", "").replaceAll("^'|'$", "");
                            if (!clean.isEmpty()) members.add(clean);
                        }
                        nt.setMembers(members);
                    }
                    db.saveTeam(nt);
                    sendJson(t, 200, ApiHandler.toJson(nt));
                }
            } else if ("DELETE".equals(t.getRequestMethod())) {
                if (!authorizeManager(t, currentUser)) return;
                String q = t.getRequestURI().getQuery();
                if (q != null && q.startsWith("id=")) db.deleteTeam(q.substring(3));
                sendJson(t, 200, "{\"ok\":true}");
            } else {
                t.sendResponseHeaders(405, -1);
            }
        }
    }

    // ─── Notifications ───────────────────────────────────────────────

    static class NotificationsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);
            if ("OPTIONS".equals(t.getRequestMethod())) { t.sendResponseHeaders(204, -1); return; }

            User currentUser = authenticate(t);
            if (currentUser == null) return;

            if ("GET".equals(t.getRequestMethod())) {
                String query = t.getRequestURI().getQuery();
                if (query != null && query.startsWith("userId=")) {
                    String uid = query.substring(7);
                    if ("member".equals(currentUser.getRole()) && !uid.equals(currentUser.getId())) {
                        sendError(t, 403, "Forbidden"); return;
                    }
                    if (query.contains("&unread=true")) {
                        sendJson(t, 200, ApiHandler.toJson(db.getUnreadNotifications(uid)));
                    } else {
                        sendJson(t, 200, ApiHandler.toJson(db.getNotificationsByUser(uid)));
                    }
                } else {
                    sendJson(t, 200, "[]");
                }
            } else if ("POST".equals(t.getRequestMethod())) {
                Map<String, String> p = ApiHandler.parseJson(ApiHandler.readStream(t.getRequestBody()));
                String id = p.getOrDefault("id", "");
                if (id.isEmpty()) {
                    if (!authorizeManager(t, currentUser)) return;
                    Notification n = new Notification(p.get("message"), p.get("type"));
                    if (p.containsKey("userId"))        n.setUserId(p.get("userId"));
                    if (p.containsKey("relatedTaskId")) n.setRelatedTaskId(p.get("relatedTaskId"));
                    db.saveNotification(n);
                    sendJson(t, 200, ApiHandler.toJson(n));
                } else {
                    Notification existing = db.getNotificationById(id);
                    if (existing == null) { sendError(t, 404, "Not found"); return; }
                    if ("manager".equals(currentUser.getRole()) || currentUser.getId().equals(existing.getUserId())) {
                        db.markAsRead(id);
                        sendJson(t, 200, "{\"ok\":true}");
                    } else {
                        sendError(t, 403, "Forbidden");
                    }
                }
            } else if ("DELETE".equals(t.getRequestMethod())) {
                if (!authorizeManager(t, currentUser)) return;
                String q = t.getRequestURI().getQuery();
                if (q != null && q.startsWith("id=")) db.deleteNotification(q.substring(3));
                sendJson(t, 200, "{\"ok\":true}");
            } else {
                t.sendResponseHeaders(405, -1);
            }
        }
    }

    // ─── Files ───────────────────────────────────────────────────────

    static class FilesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);
            if ("OPTIONS".equals(t.getRequestMethod())) { t.sendResponseHeaders(204, -1); return; }

            User currentUser = authenticate(t);
            if (currentUser == null) return;

            if ("GET".equals(t.getRequestMethod())) {
                if ("manager".equals(currentUser.getRole())) {
                    sendJson(t, 200, ApiHandler.toJson(db.getAllFiles()));
                    return;
                }
                List<File> allowed = new ArrayList<>();
                for (File file : db.getAllFiles()) {
                    if (currentUser.getId().equals(file.getUploadedBy())) {
                        allowed.add(file);
                    }
                }
                sendJson(t, 200, ApiHandler.toJson(allowed));
            } else if ("POST".equals(t.getRequestMethod())) {
                Map<String, String> p = ApiHandler.parseJson(ApiHandler.readStream(t.getRequestBody()));
                String id = p.getOrDefault("id", "");
                File file = id.isEmpty() ? null : db.getFileById(id);
                if (file != null) {
                    if (!"manager".equals(currentUser.getRole()) && !currentUser.getId().equals(file.getUploadedBy())) {
                        sendError(t, 403, "Forbidden"); return;
                    }
                    if (p.containsKey("file_name")) file.setFilename(p.get("file_name"));
                    if (p.containsKey("url"))       file.setUrl(p.get("url"));
                    if (p.containsKey("type"))      file.setType(p.get("type"));
                    if (p.containsKey("comment"))   file.setComment(p.get("comment"));
                    db.saveFile(file);
                    sendJson(t, 200, ApiHandler.toJson(file));
                } else {
                    File nf = new File(p.get("file_name"), p.get("type"));
                    if (p.containsKey("url"))        nf.setUrl(p.get("url"));
                    nf.setUploadedBy(currentUser.getId());
                    if (p.containsKey("projectId"))  nf.setProjectId(p.get("projectId"));
                    if (p.containsKey("comment"))    nf.setComment(p.get("comment"));
                    db.saveFile(nf);
                    sendJson(t, 200, ApiHandler.toJson(nf));
                }
            } else if ("DELETE".equals(t.getRequestMethod())) {
                String q = t.getRequestURI().getQuery();
                if (q != null && q.startsWith("id=")) {
                    File file = db.getFileById(q.substring(3));
                    if (file != null && ("manager".equals(currentUser.getRole()) || currentUser.getId().equals(file.getUploadedBy()))) {
                        db.deleteFile(file.getId());
                    } else {
                        sendError(t, 403, "Forbidden"); return;
                    }
                }
                sendJson(t, 200, "{\"ok\":true}");
            } else {
                t.sendResponseHeaders(405, -1);
            }
        }
    }

    // ─── Comments ────────────────────────────────────────────────────

    static class CommentsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);
            if ("OPTIONS".equals(t.getRequestMethod())) { t.sendResponseHeaders(204, -1); return; }

            User currentUser = authenticate(t);
            if (currentUser == null) return;

            if ("GET".equals(t.getRequestMethod())) {
                String query = t.getRequestURI().getQuery();
                if (query != null && query.startsWith("taskId=")) {
                    String taskId = query.substring(7);
                    Task task = db.getTaskById(taskId);
                    if (task == null) { sendError(t, 404, "Not found"); return; }
                    if ("manager".equals(currentUser.getRole()) || currentUser.getId().equals(task.getAssignee())) {
                        sendJson(t, 200, ApiHandler.toJson(db.getCommentsByTask(taskId)));
                    } else {
                        sendError(t, 403, "Forbidden");
                    }
                } else {
                    sendJson(t, 200, "[]");
                }
            } else if ("POST".equals(t.getRequestMethod())) {
                Map<String, String> p = ApiHandler.parseJson(ApiHandler.readStream(t.getRequestBody()));
                String id = p.getOrDefault("id", "");
                if (id.isEmpty()) {
                    Comment nc = new Comment(p.get("text"), p.get("author"));
                    if (p.containsKey("taskId"))    nc.setTaskId(p.get("taskId"));
                    if (p.containsKey("projectId")) nc.setProjectId(p.get("projectId"));
                    db.saveComment(nc);
                    Task ct = db.getTaskById(nc.getTaskId());
                    if (ct != null && ct.getAssignee() != null && !ct.getAssignee().isEmpty()
                            && !ct.getAssignee().equals(nc.getAuthor())) {
                        db.notify(ct.getAssignee(),
                            "New comment on: " + ct.getTitle(),
                            "comment", ct.getId());
                    }
                    sendJson(t, 200, ApiHandler.toJson(nc));
                } else {
                    Comment comment = db.getCommentById(id);
                    if (comment == null) { sendError(t, 404, "Not found"); return; }
                    if (!"manager".equals(currentUser.getRole()) && !currentUser.getName().equals(comment.getAuthor())) {
                        sendError(t, 403, "Forbidden"); return;
                    }
                    if (p.containsKey("text")) {
                        comment.setText(p.get("text"));
                        db.updateComment(comment);
                    }
                    sendJson(t, 200, "{\"ok\":true}");
                }
            } else if ("DELETE".equals(t.getRequestMethod())) {
                String q = t.getRequestURI().getQuery();
                if (q != null && q.startsWith("id=")) {
                    Comment comment = db.getCommentById(q.substring(3));
                    if (comment == null) { sendError(t, 404, "Not found"); return; }
                    if ("manager".equals(currentUser.getRole()) || currentUser.getName().equals(comment.getAuthor())) {
                        db.deleteComment(comment.getId());
                    } else {
                        sendError(t, 403, "Forbidden"); return;
                    }
                }
                sendJson(t, 200, "{\"ok\":true}");
            } else {
                t.sendResponseHeaders(405, -1);
            }
        }
    }

    // ─── Users ───────────────────────────────────────────────────────

    static class UsersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);
            if ("OPTIONS".equals(t.getRequestMethod())) { t.sendResponseHeaders(204, -1); return; }

            User currentUser = authenticate(t);
            if (currentUser == null) return;

            if ("GET".equals(t.getRequestMethod())) {
                String query = t.getRequestURI().getQuery();
                if (query != null && query.startsWith("id=")) {
                    String requestedId = query.substring(3);
                    User u = db.getUserById(requestedId);
                    if (u == null) { sendError(t, 404, "Not found"); return; }
                    if (!requestedId.equals(currentUser.getId()) && !"manager".equals(currentUser.getRole())) {
                        sendError(t, 403, "Forbidden"); return;
                    }
                    sendJson(t, 200, ApiHandler.toJson(u));
                } else {
                    if (!"manager".equals(currentUser.getRole())) {
                        sendError(t, 403, "Forbidden"); return;
                    }
                    sendJson(t, 200, ApiHandler.toJson(db.getAllUsers()));
                }
            } else if ("PUT".equals(t.getRequestMethod())) {
                String q = t.getRequestURI().getQuery();
                if (q == null || !q.startsWith("id=")) {
                    sendError(t, 400, "Missing id query param");
                    return;
                }
                String uid = q.substring(3);
                User u = db.getUserById(uid);
                if (u == null) { sendError(t, 404, "Not found"); return; }
                if (!uid.equals(currentUser.getId()) && !"manager".equals(currentUser.getRole())) {
                    sendError(t, 403, "Forbidden"); return;
                }
                Map<String, String> p = ApiHandler.parseJson(ApiHandler.readStream(t.getRequestBody()));
                if (p.containsKey("name"))     u.setName(p.get("name"));
                if (p.containsKey("email"))    u.setEmail(p.get("email"));
                if (p.containsKey("password")) u.setPassword(p.get("password"));
                if (p.containsKey("username") && "manager".equals(currentUser.getRole())) u.setUsername(p.get("username"));
                db.saveUser(u);
                sendJson(t, 200, ApiHandler.toJson(u));
            } else {
                t.sendResponseHeaders(405, -1);
            }
        }
    }

    // ─── Dashboard ───────────────────────────────────────────────────

    static class DashboardHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);
            if ("OPTIONS".equals(t.getRequestMethod())) { t.sendResponseHeaders(204, -1); return; }

            User currentUser = authenticate(t);
            if (currentUser == null) return;

            if ("GET".equals(t.getRequestMethod())) {
                String q = t.getRequestURI().getQuery();
                if (q != null && q.startsWith("stats")) {
                    if (!"manager".equals(currentUser.getRole())) {
                        sendError(t, 403, "Forbidden"); return;
                    }
                    Map<String, Integer> stats = new LinkedHashMap<>();
                    stats.put("projects", db.getTotalProjects());
                    stats.put("tasks", db.getTotalTasks());
                    stats.put("users", db.getTotalUsers());
                    stats.put("completed", db.getCompletedTasks());
                    stats.put("inProgress", db.getInProgressTasks());
                    stats.put("todo", db.getTodoTasks());
                    stats.put("onHold", db.getOnHoldTasks());
                    stats.put("files", db.getTotalFiles());
                    stats.put("teams", db.getTotalTeams());
                    sendJson(t, 200, ApiHandler.toJson(stats));
                } else if (q != null && q.startsWith("userId=")) {
                    String uid = q.substring(7);
                    if ("member".equals(currentUser.getRole()) && !uid.equals(currentUser.getId())) {
                        sendError(t, 403, "Forbidden"); return;
                    }
                    List<Task> userTasks = db.getTasksByAssignee(uid);
                    int total = userTasks.size();
                    int completed = 0, inProgress = 0, todo = 0;
                    for (Task tt : userTasks) {
                        if ("done".equals(tt.getStatus()))       completed++;
                        else if ("inprogress".equals(tt.getStatus())) inProgress++;
                        else                                     todo++;
                    }
                    Set<String> projectIds = new HashSet<>();
                    for (Task tt : userTasks) if (tt.getProjectId() != null) projectIds.add(tt.getProjectId());
                    Map<String, Object> stats = new LinkedHashMap<>();
                    stats.put("assignedTasks", total);
                    stats.put("completedTasks", completed);
                    stats.put("inProgressTasks", inProgress);
                    stats.put("pendingTasks", todo);
                    stats.put("projectsIn", projectIds.size());
                    sendJson(t, 200, ApiHandler.toJson(stats));
                } else {
                    sendError(t, 400, "Use ?stats or ?userId=...");
                }
            } else {
                t.sendResponseHeaders(405, -1);
            }
        }
    }
}
