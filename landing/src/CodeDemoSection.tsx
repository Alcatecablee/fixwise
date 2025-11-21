import React, { useState } from "react";
import { Play, Code, CheckCircle } from "lucide-react";

export function CodeDemoSection() {
  const [activeTab, setActiveTab] = useState("before");

  const beforeCode = `// Problematic Code
function UserProfile({ userId }) {
  const [user, setUser] = useState()
  const [posts, setPosts] = useState([])

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(setUser)
  })

  return (
    <div>
      <h1>{user.name}</h1>
      {posts.map(post => (
        <div>{post.title}</div>
      ))}
    </div>
  )
}`;

  const afterCode = `// Optimized Code
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, postsRes] = await Promise.all([
          fetch(\`/api/users/\${userId}\`),
          fetch(\`/api/posts?user=\${userId}\`)
        ])

        const [userData, postsData] = await Promise.all([
          userRes.json(),
          postsRes.json()
        ])

        setUser(userData)
        setPosts(postsData)
      } catch (error) {
        console.error('Failed to fetch:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>{user?.name}</h1>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  )
}`;

  const improvements = [
    {
      icon: CheckCircle,
      text: "Added TypeScript types",
      color: "text-white",
    },
    {
      icon: CheckCircle,
      text: "Fixed missing dependency array",
      color: "text-zinc-400",
    },
    {
      icon: CheckCircle,
      text: "Added proper error handling",
      color: "text-zinc-400",
    },
    {
      icon: CheckCircle,
      text: "Added missing key props",
      color: "text-zinc-400",
    },
    {
      icon: CheckCircle,
      text: "Optimized with Promise.all",
      color: "text-zinc-400",
    },
  ];

  return (
    <section
      id="demo"
      className="py-24 px-4"
      role="region"
      aria-labelledby="demo-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2
            id="demo-heading"
            className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white"
          >
            See NeuroLint in Action
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium">
            Watch how our advanced rule-based system transforms problematic code
            into clean, efficient, and type-safe solutions across all 6 analysis
            layers.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Code Demo */}
          <div className="order-2 lg:order-1">
            <div className="bg-gray-900/90 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
              {/* Terminal Header */}
              <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-zinc-600 rounded-full"></div>
                  <div className="w-3 h-3 bg-zinc-600 rounded-full"></div>
                  <div className="w-3 h-3 bg-zinc-600 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-300 ml-4 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  UserProfile.tsx
                </div>
              </div>

              {/* Tab Controls */}
              <div className="bg-gray-800/50 border-b border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("before")}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === "before"
                        ? "text-red-400 border-b-2 border-red-400 bg-gray-750"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Before (Issues Found)
                  </button>
                  <button
                    onClick={() => setActiveTab("after")}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === "after"
                        ? "text-white border-b-2 border-zinc-600 bg-zinc-800"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    After (NeuroLint Fixed)
                  </button>
                </div>
              </div>

              {/* Code Content */}
              <div className="p-6">
                <pre className="font-mono text-sm text-gray-300 overflow-x-auto">
                  <code>{activeTab === "before" ? beforeCode : afterCode}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Improvements List */}
          <div className="order-1 lg:order-2 space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-white">
                What NeuroLint Fixed
              </h3>
              <div className="space-y-4">
                {improvements.map((improvement, index) => {
                  const IconComponent = improvement.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-gray-800/30 border border-gray-700 rounded-xl"
                    >
                      <IconComponent
                        className={`w-5 h-5 ${improvement.color}`}
                      />
                      <span className="text-gray-300">{improvement.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-zinc-900">
              <div className="flex items-center gap-2 mb-3">
                <Play className="w-5 h-5 text-white" />
                <h4 className="font-semibold text-white">
                  Layer Analysis Results
                </h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Layer 1: Configuration</span>
                  <span className="text-white">✓ Passed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Layer 2: Pattern Fixes</span>
                  <span className="text-white">✓ 2 fixes applied</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">
                    Layer 3: Component Best Practices
                  </span>
                  <span className="text-white">✓ 3 fixes applied</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">
                    Layer 4: Hydration Guard
                  </span>
                  <span className="text-white">✓ Passed</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button className="bg-zinc-900">
                <Play className="w-5 h-5" />
                Try Your Own Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
