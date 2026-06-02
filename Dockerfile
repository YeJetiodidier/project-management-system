FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# Copy backend source and library
COPY Backend/ ./Backend/

# Compile all Java files with the PostgreSQL JDBC driver on the classpath
RUN javac -cp "Backend/lib/*" -d Backend/ Backend/*.java

FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy compiled classes and library
COPY --from=build /app/Backend/ ./Backend/

# Copy frontend for static file serving
COPY frontend/ ./frontend/

# MainServer references "../frontend" relative to its working dir
WORKDIR /app/Backend

ENV PORT=8080
EXPOSE ${PORT}

CMD ["java", "-cp", ".:lib/*", "MainServer"]
