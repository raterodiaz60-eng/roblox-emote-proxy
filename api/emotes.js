// api/emotes.js
// Proxy para emotes de Roblox

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") return res.status(200).end()

    const { cursor } = req.query

    try {
        // catalog/v1/search/items/details ya incluye precio y nombre sin segundo request
        // Category=12 = Avatar, Subcategory=39 = Emotes
        let url = `https://catalog.roblox.com/v1/search/items/details?Category=12&Subcategory=39&Limit=30&SortType=2`
        if (cursor) url += `&Cursor=${encodeURIComponent(cursor)}`

        const response = await fetch(url, {
            headers: {
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Referer": "https://www.roblox.com/catalog",
                "Origin": "https://www.roblox.com",
                "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site"
            }
        })

        console.log("Status:", response.status)

        if (!response.ok) {
            const text = await response.text().catch(() => "")
            console.error("Error body:", text.slice(0, 300))
            return res.status(response.status).json({
                error: `Roblox API respondió ${response.status}`,
                detail: text.slice(0, 200)
            })
        }

        const data = await response.json()

        const emotes = (data.data ?? []).map(item => ({
            id:          item.id,
            name:        item.name,
            price:       item.price ?? null,
            isForSale:   item.price != null,
            iconThumb:   `rbxthumb://type=Asset&id=${item.id}&w=150&h=150`,
            creatorName: item.creatorName ?? ""
        }))

        return res.status(200).json({
            emotes,
            nextCursor: data.nextPageCursor ?? null
        })

    } catch (err) {
        console.error("Proxy error:", err)
        return res.status(500).json({ error: err.message })
    }
}
