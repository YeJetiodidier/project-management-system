import java.io.*;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * ApiHandler - a small utility class for JSON (de)serialisation.
 *
 * OOP Concepts Demonstrated:
 *  - ABSTRACTION: The class hides the JSON grammar and the reflection
 *    details. Callers just hand any object to toJson() or any JSON
 *    string to parseJson() and get a usable result back.
 *  - POLYMORPHISM: toJson() uses the parameter type 'Object' and
 *    runtime 'instanceof' checks (String, Number, Boolean, Date, List,
 *    Map, custom bean) to behave differently for each kind of input.
 *    This is a classic example of runtime (ad-hoc) polymorphism.
 *  - EXCEPTION HANDLING: parseJson()/toJson() swallow IllegalAccessException
 *    thrown by reflection so that a single bad field does not break
 *    the entire serialisation of an object.
 */
public class ApiHandler {

    // ─── POLYMORPHISM (Ad-hoc / Runtime) ────────────────────────────
    // toJson() accepts an 'Object' and selects a serialisation strategy
    // at runtime based on the actual subtype. The same method name
    // produces a different result depending on the input type.
    public static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\"" + escapeJson((String)obj) + "\"";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        if (obj instanceof java.util.Date) return "\"" + escapeJson(obj.toString()) + "\"";
        
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                sb.append(toJson(list.get(i)));
                if (i < list.size() - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        
        if (obj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) obj;
            StringBuilder sb = new StringBuilder("{");
            int i = 0;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                sb.append("\"").append(entry.getKey()).append("\":").append(toJson(entry.getValue()));
                if (i < map.size() - 1) sb.append(",");
                i++;
            }
            sb.append("}");
            return sb.toString();
        }
        
        // ─── ABSTRACTION ─────────────────────────────────────────────
        // Reflection-based field enumeration is hidden behind toJson().
        // The caller does not need to know that setAccessible(true) is
        // being used, nor that each field is read with field.get().
        // ─── EXCEPTION HANDLING ──────────────────────────────────────
        // The empty catch {} intentionally swallows any reflection
        // exception so a single inaccessible field does not crash the
        // whole serialisation. The output simply omits that field.
        StringBuilder sb = new StringBuilder("{");
        Field[] fields = obj.getClass().getDeclaredFields();
        int count = 0;
        for (Field field : fields) {
            field.setAccessible(true);
            try {
                Object value = field.get(obj);
                if (count > 0) sb.append(",");
                sb.append("\"").append(field.getName()).append("\":").append(toJson(value));
                count++;
            } catch (Exception e) {}
        }
        sb.append("}");
        return sb.toString();
    }
    
    private static String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
    
    public static Map<String, String> parseJson(String json) {
        Map<String, String> map = new HashMap<>();
        if (json == null) return map;
        json = json.trim();
        if (json.startsWith("{") && json.endsWith("}")) {
            json = json.substring(1, json.length() - 1);
        }
        
        boolean inQuotes = false;
        int bracketDepth = 0;
        StringBuilder currentKey = new StringBuilder();
        StringBuilder currentValue = new StringBuilder();
        boolean parsingKey = true;

        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '\\' && i + 1 < json.length() && json.charAt(i+1) == '"') {
                if (parsingKey) currentKey.append('"'); else currentValue.append('"');
                i++;
                continue;
            }
            if (c == '"') {
                inQuotes = !inQuotes;
                continue;  // Skip the quote character itself
            }

            if (!inQuotes) {
                if (c == '[' || c == '{') bracketDepth++;
                else if (c == ']' || c == '}') bracketDepth = Math.max(0, bracketDepth - 1);
            }

            if (!inQuotes && bracketDepth == 0 && c == ':') {
                parsingKey = false;
                continue;
            }
            if (!inQuotes && bracketDepth == 0 && c == ',') {
                map.put(currentKey.toString().trim(), currentValue.toString().trim());
                currentKey.setLength(0);
                currentValue.setLength(0);
                parsingKey = true;
                continue;
            }

            if (parsingKey) {
                if (c != ' ' && c != '\n' && c != '\r') currentKey.append(c);
            } else {
                currentValue.append(c);
            }
        }
        if (currentKey.length() > 0) {
            map.put(currentKey.toString().trim(), currentValue.toString().trim());
        }
        return map;
    }
    
    // ─── EXCEPTION HANDLING ──────────────────────────────────────────
    // readStream() declares 'throws IOException' so callers upstream
    // (the HTTP handlers in MainServer) must either catch it or
    // propagate it further. The byte buffer / while-loop reads until
    // end-of-stream (-1).
    public static String readStream(InputStream is) throws IOException {
        ByteArrayOutputStream result = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int length;
        while ((length = is.read(buffer)) != -1) {
            result.write(buffer, 0, length);
        }
        return result.toString(StandardCharsets.UTF_8.name());
    }
}
