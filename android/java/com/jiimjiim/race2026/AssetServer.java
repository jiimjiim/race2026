package com.jiimjiim.race2026;

import android.content.res.AssetManager;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AssetServer {
    private final AssetManager assets;
    private final String root;
    private final Map<String, String> mime = new HashMap<>();
    private ServerSocket socket;
    private ExecutorService pool;
    private volatile boolean running;

    public AssetServer(AssetManager assets, String root) {
        this.assets = assets;
        this.root = root;
        mime.put("html", "text/html; charset=utf-8");
        mime.put("js", "application/javascript; charset=utf-8");
        mime.put("css", "text/css; charset=utf-8");
        mime.put("json", "application/json; charset=utf-8");
        mime.put("svg", "image/svg+xml");
        mime.put("png", "image/png");
        mime.put("jpg", "image/jpeg");
        mime.put("jpeg", "image/jpeg");
        mime.put("ico", "image/x-icon");
        mime.put("wav", "audio/wav");
        mime.put("ttf", "font/ttf");
    }

    public void start() throws IOException {
        socket = new ServerSocket(0, 16, InetAddress.getByName("127.0.0.1"));
        running = true;
        pool = Executors.newCachedThreadPool();
        Thread t = new Thread(() -> {
            while (running) {
                try {
                    Socket c = socket.accept();
                    pool.execute(() -> handle(c));
                } catch (IOException e) {
                    if (running) e.printStackTrace();
                }
            }
        }, "asset-server");
        t.setDaemon(true);
        t.start();
    }

    public int getPort() {
        return socket.getLocalPort();
    }

    public void stop() {
        running = false;
        try {
            if (socket != null) socket.close();
        } catch (IOException ignored) {
        }
        if (pool != null) pool.shutdownNow();
    }

    private void handle(Socket c) {
        try (Socket sock = c) {
            sock.setSoTimeout(15000);
            BufferedReader in = new BufferedReader(new InputStreamReader(sock.getInputStream(), StandardCharsets.ISO_8859_1));
            String requestLine = in.readLine();
            if (requestLine == null) return;
            String header;
            while ((header = in.readLine()) != null && !header.isEmpty()) {
                // headers ignored
            }
            String[] parts = requestLine.split(" ");
            if (parts.length < 2) {
                write(sock, 400, "text/plain", "bad request".getBytes(StandardCharsets.UTF_8), false);
                return;
            }
            String method = parts[0];
            String path = parts[1];
            int q = path.indexOf('?');
            if (q >= 0) path = path.substring(0, q);
            try {
                path = URLDecoder.decode(path, "UTF-8");
            } catch (Exception ignored) {
            }
            if (path.isEmpty() || path.equals("/")) path = "/index.html";
            if (!path.startsWith("/")) path = "/" + path;
            if (path.contains("..") || path.contains("\\")) {
                write(sock, 403, "text/plain", "forbidden".getBytes(StandardCharsets.UTF_8), false);
                return;
            }
            byte[] data;
            try (InputStream is = assets.open(root + path)) {
                data = readAll(is);
            } catch (IOException e) {
                write(sock, 404, "text/plain", "not found".getBytes(StandardCharsets.UTF_8), false);
                return;
            }
            String ext = "";
            int dot = path.lastIndexOf('.');
            if (dot >= 0) ext = path.substring(dot + 1).toLowerCase(Locale.US);
            String type = mime.containsKey(ext) ? mime.get(ext) : "application/octet-stream";
            write(sock, 200, type, data, "HEAD".equals(method));
        } catch (Exception ignored) {
        }
    }

    private static byte[] readAll(InputStream is) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[65536];
        int n;
        while ((n = is.read(buf)) != -1) out.write(buf, 0, n);
        return out.toByteArray();
    }

    private static void write(Socket sock, int status, String type, byte[] data, boolean head) throws IOException {
        String reason = status == 200 ? "OK" : status == 404 ? "Not Found" : status == 403 ? "Forbidden" : "Bad Request";
        OutputStream out = sock.getOutputStream();
        String headText = "HTTP/1.1 " + status + " " + reason + "\r\n"
                + "Content-Type: " + type + "\r\n"
                + "Content-Length: " + data.length + "\r\n"
                + "Cache-Control: no-store\r\n"
                + "Connection: close\r\n\r\n";
        out.write(headText.getBytes(StandardCharsets.ISO_8859_1));
        if (!head) out.write(data);
        out.flush();
    }
}
