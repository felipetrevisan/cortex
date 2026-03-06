const CACHE_NAME = 'cortex-system-shell-v2'
const APP_SHELL = [
	'/',
	'/login',
	'/dashboard',
	'/offline',
	'/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
	)
})

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE_NAME)
						.map((key) => caches.delete(key)),
				),
			),
	)
})

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return
	const requestUrl = new URL(event.request.url)
	const isSameOrigin = requestUrl.origin === self.location.origin
	if (!isSameOrigin) return
	const isNavigationRequest = event.request.mode === 'navigate'

	event.respondWith(
		fetch(event.request)
			.then((response) => {
				const cloned = response.clone()
				caches
					.open(CACHE_NAME)
					.then((cache) => cache.put(event.request, cloned))
				return response
			})
			.catch(() =>
				caches
					.match(event.request)
					.then((cached) => {
						if (cached) return cached
						if (isNavigationRequest) return caches.match('/offline')
						return caches.match('/')
					}),
			),
	)
})
