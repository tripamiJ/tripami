self.addEventListener('push', function(event) {
    event.waitUntil(self.registration.showNotification('Your mind', {
        body: JSON.stringify(event),
    }));
});

self.addEventListener('pushsubscriptionchange', function(event) {
    event.waitUntil(
        self.registration.pushManager.subscribe({ userVisibleOnly: true })
            .then(function(subscription) {
                return fetch('register', {
                    method: 'post',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        endpoint: subscription.endpoint
                    })
                });
            })
    );
});
