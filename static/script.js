// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Get user data from Telegram
const user = tg.initDataUnsafe.user;
const userId = user?.id?.toString() || 'guest';
const username = user?.username || 'Anonymous';

// API base URL (use your Render/Heroku URL in production)
const API_URL = window.location.origin;

// Initialize user
async function initUser() {
    try {
        const response = await fetch(`${API_URL}/api/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, username: username })
        });
        const data = await response.json();
        updatePointsDisplay(data.points);
    } catch (error) {
        console.error('Error initializing user:', error);
    }
}

// Update points display
function updatePointsDisplay(points) {
    document.getElementById('userPoints').textContent = points.toFixed(2);
}

// Show Rewarded Interstitial Ad
async function showRewardedAd() {
    try {
        await show_9584558().then(() => {
            // User watched the ad
            addPoints(10);
            tg.showAlert('🎉 Congratulations! You earned 10 points!');
        });
    } catch (error) {
        console.error('Ad error:', error);
        tg.showAlert('Ad could not be loaded. Please try again.');
    }
}

// Show In-App Interstitial
function showInAppAd() {
    show_9584558({
        type: 'inApp',
        inAppSettings: {
            frequency: 2,
            capping: 0.1,
            interval: 30,
            timeout: 5,
            everyPage: false
        }
    });
}

// Add points to user account
async function addPoints(points) {
    try {
        const response = await fetch(`${API_URL}/api/add_points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, points: points })
        });
        const data = await response.json();
        updatePointsDisplay(data.new_points);
    } catch (error) {
        console.error('Error adding points:', error);
    }
}

// Complete daily task
async function completeTask(taskType) {
    if (taskType === 'daily_checkin') {
        // Check if already checked in today
        const lastCheckin = localStorage.getItem('lastCheckin');
        const today = new Date().toDateString();
        
        if (lastCheckin === today) {
            tg.showAlert('You already checked in today! Come back tomorrow.');
            return;
        }
        
        addPoints(5);
        localStorage.setItem('lastCheckin', today);
        document.getElementById('checkinBtn').textContent = 'Done ✓';
        document.getElementById('checkinBtn').disabled = true;
        tg.showAlert('✅ Daily check-in complete! +5 points');
        
    } else if (taskType === 'invite_friend') {
        const botUsername = 'RealCashEarnBot'; // Your bot username
        const inviteLink = `https://t.me/${botUsername}?start=${userId}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(inviteLink).then(() => {
            tg.showAlert('Invite link copied! Share with friends to earn 50 points each.');
        });
    }
}

// Show leaderboard
async function showLeaderboard() {
    try {
        const response = await fetch(`${API_URL}/api/admin/users`);
        const users = await response.json();
        
        // Sort by points
        users.sort((a, b) => b.points - a.points);
        const top10 = users.slice(0, 10);
        
        let message = '🏆 Top 10 Earners:\n\n';
        top10.forEach((user, index) => {
            message += `${index + 1}. ${user.username} - ${user.points.toFixed(2)} points\n`;
        });
        
        tg.showAlert(message);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Initialize app
window.addEventListener('load', () => {
    initUser();
    
    // Check daily checkin status
    const lastCheckin = localStorage.getItem('lastCheckin');
    const today = new Date().toDateString();
    if (lastCheckin === today) {
        document.getElementById('checkinBtn').textContent = 'Done ✓';
        document.getElementById('checkinBtn').disabled = true;
    }
});

// Set Telegram theme colors
tg.setHeaderColor('#1a1a2e');
tg.setBackgroundColor('#16213e');