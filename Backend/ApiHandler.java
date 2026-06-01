import java.io.*;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class ApiHandler {
    
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
        
        // Reflection for custom objects
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
