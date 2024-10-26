from flask import Flask, render_template, send_from_directory, abort
import os
import markdown
from datetime import datetime
import requests
import time

app = Flask(__name__)

# Global variable to store the cached Discord status
discord_status_cache = None
last_fetched_time = 0
CACHE_DURATION = 10  # Cache duration in seconds

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/portfolio')
def portfolio():
    return render_template('portfolio.html')

@app.route('/useful-stuff')
def useful_stuff():
    return render_template('useful_stuff.html')

@app.route('/blog')
def blog_list():
    blog_posts = []
    blog_folder = os.path.join(app.root_path, 'blog')
    for filename in os.listdir(blog_folder):
        if filename.endswith('.md'):
            with open(os.path.join(blog_folder, filename), 'r') as file:
                content = file.read()
                md = markdown.Markdown(extensions=['meta'])
                html = md.convert(content)
                title = md.Meta.get('title', ['Untitled'])[0]
                date = md.Meta.get('date', [''])[0]
                blog_posts.append({
                    'title': title,
                    'date': datetime.strptime(date, '%Y-%m-%d').date() if date else None,
                    'filename': filename[:-3]  # Remove .md extension
                })
    blog_posts.sort(key=lambda x: x['date'] or datetime.min, reverse=True)
    return render_template('blog_list.html', blog_posts=blog_posts)

@app.route('/blog/<post_name>')
def blog_post(post_name):
    try:
        with open(os.path.join(app.root_path, 'blog', f'{post_name}.md'), 'r') as file:
            content = file.read()
            md = markdown.Markdown(extensions=['meta'])
            html = md.convert(content)
            title = md.Meta.get('title', ['Untitled'])[0]
            date = md.Meta.get('date', [''])[0]
            return render_template('blog_post.html', title=title, date=date, content=html)
    except FileNotFoundError:
        abort(404)

@app.route('/activity')
def activity():
    global discord_status_cache, last_fetched_time

    current_time = time.time()
    # Check if the cache is still valid
    if discord_status_cache is None or (current_time - last_fetched_time) > CACHE_DURATION:
        api_url = "https://api.lanyard.rest/v1/users/1092100801478004816"
        try:
            response = requests.get(api_url)
            discord_status_cache = response.json()  # Cache the response
            last_fetched_time = current_time  # Update the last fetched time
        except Exception as e:
            return {"success": False, "error": str(e)}, 500  # Handle errors gracefully

    return discord_status_cache  # Return the cached response

@app.route('/static/css/<path:filename>')
def serve_css(filename):
    css_path = os.path.join(app.root_path, 'static', 'css', filename)
    return send_from_directory(os.path.dirname(css_path), os.path.basename(css_path))

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    js_path = os.path.join(app.root_path, 'static', 'js', filename)
    return send_from_directory(os.path.dirname(js_path), os.path.basename(js_path))

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(403)
def forbidden(e):
    return render_template('403.html'), 403

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/bg')
def background():
    return render_template('background.html')

if __name__ == '__main__':
    app.run(debug=True)
