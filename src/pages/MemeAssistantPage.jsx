import React, { useState } from "react";

// The Humor API key from your .env
const API_KEY = import.meta.env.VITE_HUMOR_API_KEY || "YOUR_API_KEY_HERE";

/**
 * MemeAssistantPage
 * 
 * - Chatbot uses GET /memes/random with optional keywords
 * - Search uses GET /memes/search with ?keywords=...&number=4
 * - Additional console logs to help debug 400 errors
 */
function MemeAssistantPage() {
  const [mode, setMode] = useState("chatbot"); // "chatbot" or "search"

  // --- Chatbot states ---
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // --- Search states ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Simple caching
  const [chatCache, setChatCache] = useState({});
  const [searchCache, setSearchCache] = useState({});

  // ----------------------------------
  //         Meme Chatbot
  // ----------------------------------
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) {
      // If user typed nothing, let's fetch a completely random meme
      // or you can simply return and do nothing
      // For demonstration, we fetch a completely random meme
      const userMsg = { sender: "user", content: "(Random Meme)" };
      setChatMessages((prev) => [...prev, userMsg]);
      await fetchRandomMeme("");
      setChatInput("");
      return;
    }

    setChatError(null);

    // Add user message
    const userMsg = { sender: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);

    // If we have a cached answer for the same input, use it
    if (chatCache[chatInput]) {
      const botMsg = { sender: "bot", content: chatCache[chatInput] };
      setChatMessages((prev) => [...prev, botMsg]);
      setChatInput("");
      return;
    }

    await fetchRandomMeme(chatInput);
    setChatInput("");
  };

  // A helper to fetch a random meme (with optional keywords)
  const fetchRandomMeme = async (input) => {
    setChatLoading(true);
    try {
      let url = `https://api.humorapi.com/memes/random?api-key=${API_KEY}`;
      
      // If there's input, add &keywords=
      if (input.trim()) {
        const keywords = encodeURIComponent(input.trim());
        url += `&keywords=${keywords}`;
      }

      console.log("Chatbot GET URL:", url); // Debug

      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        console.error("Chatbot fetch error response:", response);
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      console.log("Chatbot response data:", data); // Debug

      // data.url is the link to the meme
      const memeUrl = data.url || "https://placekitten.com/300/300";
      const botMsg = { sender: "bot", content: memeUrl };
      setChatMessages((prev) => [...prev, botMsg]);

      // Cache result if user typed something
      if (input.trim()) {
        setChatCache((prev) => ({ ...prev, [input]: memeUrl }));
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setChatError("Failed to fetch meme. Please try again.");
      // fallback
      const fallback = "https://placekitten.com/400/400";
      setChatMessages((prev) => [...prev, { sender: "bot", content: fallback }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ----------------------------------
  //         Meme Search
  // ----------------------------------
  const handleSearchMeme = async () => {
    if (!searchQuery.trim()) {
      console.log("Empty search query, doing nothing.");
      return;
    }
    setSearchError(null);

    // Check cache
    if (searchCache[searchQuery]) {
      setSearchResults(searchCache[searchQuery]);
      setSearchQuery("");
      return;
    }

    setSearchLoading(true);
    try {
      const keywords = encodeURIComponent(searchQuery.trim());
      let url = `https://api.humorapi.com/memes/search?api-key=${API_KEY}&number=4`;

      // If there's input, add &keywords
      if (keywords) {
        url += `&keywords=${keywords}`;
      }

      console.log("Search GET URL:", url); // Debug

      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        console.error("Search fetch error response:", response);
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      console.log("Search response data:", data); // Debug

      // data.memes => array of { id, url, type }
      const memes = data.memes || [];
      // If nothing returned, let's fallback to a friendly no-result
      if (!memes.length) {
        console.log("No memes found for query:", searchQuery);
        setSearchResults([
          { url: "https://placekitten.com/350/350", title: "No memes found." },
        ]);
      } else {
        // Convert them to a shape { url, title }
        const shapedResults = memes.map((m, idx) => ({
          url: m.url || "https://placekitten.com/300/300",
          title: `Meme #${m.id || idx + 1}`,
        }));
        setSearchResults(shapedResults);
        setSearchCache((prev) => ({ ...prev, [searchQuery]: shapedResults }));
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("Failed to search memes. Please try again.");
      setSearchResults([
        {
          url: "https://placekitten.com/350/350",
          title: "Error retrieving meme",
        },
      ]);
    } finally {
      setSearchLoading(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Meme Assistant</h1>

      {/* Toggle Buttons */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setMode("chatbot")}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            mode === "chatbot" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          Meme Chatbot
        </button>
        <button
          onClick={() => setMode("search")}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            mode === "search" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          Meme Search
        </button>
      </div>

      {/* Meme Chatbot */}
      {mode === "chatbot" && (
        <div>
          {/* Chat Display */}
          <div className="border border-gray-200 rounded-lg p-4 mb-4 h-80 overflow-y-auto">
            {chatMessages.length === 0 && !chatLoading && (
              <p className="text-gray-500">No messages yet. Say something!</p>
            )}

            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex mb-3 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "bot" ? (
                  <img
                    src={msg.content}
                    alt="Meme from bot"
                    className="max-w-xs rounded-lg border border-gray-300"
                  />
                ) : (
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg max-w-xs">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-center mt-4">
                {/* You can replace with a fancy spinner */}
                <div className="loader mr-2"></div>
                <p className="text-gray-500">Fetching meme...</p>
              </div>
            )}
          </div>

          {/* Chat Error */}
          {chatError && (
            <div className="text-red-500 mb-4">{chatError}</div>
          )}

          {/* Chat Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded px-3 py-2"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendChatMessage();
              }}
            />
            <button
              onClick={handleSendChatMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={chatLoading}
            >
              {chatLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}

      {/* Meme Search */}
      {mode === "search" && (
        <div>
          {/* Search Input */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-semibold">
              Describe the Meme:
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder='e.g. "rocket", "office cat", "funny dog"...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchMeme();
              }}
            />
          </div>
          <button
            onClick={handleSearchMeme}
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={searchLoading}
          >
            {searchLoading ? "Searching..." : "Search Meme"}
          </button>

          {/* Search Error */}
          {searchError && (
            <div className="text-red-500 mt-4">{searchError}</div>
          )}

          {/* Search Results */}
          <div className="mt-6">
            {searchResults.length > 0 && (
              <h3 className="text-lg font-semibold mb-2">
                {searchResults.length === 1
                  ? "Your Meme Match"
                  : "Top Meme Results"}
              </h3>
            )}
            {searchLoading && (
              <div className="flex justify-center mt-4">
                <div className="loader mr-2"></div>
                <p className="text-gray-500">Searching memes...</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded border border-gray-200 text-center"
                >
                  <img
                    src={item.url || "https://placekitten.com/300/300"}
                    alt={item.title || `Meme #${idx + 1}`}
                    className="max-w-full h-auto mb-2 mx-auto"
                  />
                  <p className="text-gray-700">{item.title || "Meme"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemeAssistantPage;