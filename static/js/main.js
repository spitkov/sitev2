document.addEventListener('DOMContentLoaded', () => {
    // Create the custom cursor dot
    const cursorDot = document.createElement('div');
    cursorDot.classList.add('custom-cursor');
    document.body.appendChild(cursorDot);

    // Update the position of the cursor dot without delay
    document.addEventListener('mousemove', (e) => {
        cursorDot.style.left = `${e.clientX}px`;
        cursorDot.style.top = `${e.clientY}px`;
    });

    // Add hover effect to buttons and links
    const interactiveElements = document.querySelectorAll('button, a, .material-button'); // Select buttons and links
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursorDot.classList.add('button-hover');
        });
        element.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('button-hover');
        });
    });

    let previousData = null;

    function getDiscordStatus() {
        const apiUrl = "/activity";
        fetchData(apiUrl)
            .then((data) => {
                if (data.success && JSON.stringify(data) !== JSON.stringify(previousData)) {
                    updateDiscordStatus(data);
                    previousData = data;
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }

    async function fetchData(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            return null;
        }
    }

    function updateDiscordStatus(data) {
        if (!data || !data.success) {
            console.error("Invalid data format or unsuccessful response");
            return;
        }

        const ulElement = document.querySelector(`ul.contacts-list`);
        if (!ulElement) {
            console.error("contacts-list element not found");
            return; // Prevent further execution if the element is not found
        }
        ulElement.innerHTML = ''; // Clear existing items
        const newItems = generateDiscordItems(data);

        // Add new items
        newItems.forEach((newItem) => {
            ulElement.innerHTML += newItem.html;
        });
    }

    function generateDiscordItems(data) {
        const items = [];
        const { discord_user, discord_status, activities } = data.data;
        const { username, avatar, id } = discord_user;
        const avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
        
        let statusColor;
        switch (discord_status) {
            case 'online': statusColor = '#43b581'; break;
            case 'idle': statusColor = '#faa61a'; break;
            case 'dnd': statusColor = '#f04747'; break;
            default: statusColor = '#747f8d'; // offline or invisible
        }

        // User status item
        items.push({
            id: 'discord-user-status',
            html: `
            <li id="discord-user-status" class="contact-item discord-item">
                <div class="icon-box" style="position: relative;">
                    <img src="${avatarUrl}" alt="${username} profile image" style="width: 48px; height: 48px; border-radius: 14px;">
                    <div style="position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; border-radius: 50%; background-color: ${statusColor}; border: 2px solid var(--bg-color);"></div>
                </div>
                <div class="contact-info">
                    <p class="contact-title">Discord</p>
                    <p class="contact-link">${username}</p>
                </div>
            </li>`
        });

        // Activity items
        activities.forEach((activity, index) => {
            if (activity.name === "Spotify") {
                const { details: song, state: artist, assets, sync_id } = activity;
                const album_art_url = assets.large_image.startsWith('spotify:')
                    ? `https://i.scdn.co/image/${assets.large_image.slice(8)}`
                    : assets.large_image;

                items.push({
                    id: 'discord-activity-spotify',
                    html: `
                    <li id="discord-activity-spotify" class="contact-item discord-item" style="margin-top: 10px;">
                        <div class="icon-box">
                            <img src="${album_art_url}" alt="Spotify" style="width: 48px; height: 48px; border-radius: 14px;">
                        </div>
                        <div class="contact-info">
                            <p class="contact-title">Spotify</p>
                            <p class="contact-link" style="max-width:150px; cursor: pointer;" onclick="window.open('https://open.spotify.com/track/${sync_id}', '_blank')">${song}</p>
                            <p class="contact-title" style="cursor: pointer;" onclick="window.open('https://open.spotify.com/search/${encodeURIComponent(artist)}', '_blank')">${artist}</p>
                        </div>
                    </li>`
                });
            } else {
                const name = activity.name;
                const state = activity.state || "";
                const details = activity.details || "";
                const application_id = activity.application_id;
                let iconUrl = getActivityIcon(activity, application_id);

                items.push({
                    id: `discord-activity-${index}`,
                    html: `
                    <li id="discord-activity-${index}" class="contact-item discord-item" style="margin-top: 10px;">
                        <div class="icon-box">
                            <img src="${iconUrl}" alt="${name} icon" style="width: 48px; height: 48px; border-radius: 14px;">
                        </div>
                        <div class="contact-info">
                            <p class="contact-title">${name}</p>
                            <p class="contact-link" style="max-width:150px">${details}</p>
                            ${state ? `<p class="contact-title">${state}</p>` : ''}
                        </div>
                    </li>`
                });
            }
        });

        return items;
    }

    function getActivityIcon(activity, application_id) {
        if (activity.type === 2 && activity.id === 'spotify:1') {
            // Spotify
            return activity.assets.large_image.startsWith('spotify:')
                ? `https://i.scdn.co/image/${activity.assets.large_image.slice(8)}`
                : activity.assets.large_image;
        }

        if (activity.assets) {
            if (activity.assets.large_image) {
                if (activity.assets.large_image.startsWith('mp:external')) {
                    return activity.assets.large_image.replace(/mp:external\/.*\/https\//, 'https://');
                }
                return `https://cdn.discordapp.com/app-assets/${application_id}/${activity.assets.large_image}.png`;
            }
            if (activity.assets.small_image) {
                return `https://cdn.discordapp.com/app-assets/${application_id}/${activity.assets.small_image}.png`;
            }
        }

        // Default icon if no asset is found
        return `https://cdn.discordapp.com/app-icons/${application_id}/favicon.png`;
    }

    // Call getDiscordStatus every 5 seconds
    setInterval(getDiscordStatus, 5000);

    // Initial call to getDiscordStatus
    getDiscordStatus();

    // Add this function to handle page transitions
    function handlePageTransition() {
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = this.href; // Navigate to the new page
        }, 500); // Match the duration of the fade-out animation
    }

    // Attach the transition to all links in the navbar
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link behavior
            handlePageTransition.call(this); // Call the transition function
        });
    });

    function renderMarkdown(content) {
        // Replace <warn> tags with a styled div
        content = content.replace(/<warn>(.*?)<\/warn>/g, '<div class="warning">$1</div>');
        
        // Use marked to convert Markdown to HTML
        return marked(content);
    }

    // Example usage
    const markdownContent = `<warn>This is a warning message!</warn>\n\n# My Blog Post\nThis is some content.`;
    const htmlContent = renderMarkdown(markdownContent);
    document.getElementById('blog-post').innerHTML = htmlContent;
});
