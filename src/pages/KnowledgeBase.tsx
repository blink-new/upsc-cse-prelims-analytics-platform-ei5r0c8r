import { useState } from 'react'
import { Search, BookOpen, Tag, Plus, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('')

  const knowledgeItems = [
    {
      id: '1',
      title: 'Constitutional Amendments Process',
      content: 'Article 368 of the Indian Constitution deals with the power of Parliament to amend the Constitution...',
      type: 'concept',
      topic: 'Polity',
      tags: ['constitution', 'amendments', 'article-368'],
      createdAt: '2024-01-20'
    },
    {
      id: '2',
      title: 'GDP vs GNP Difference',
      content: 'Gross Domestic Product (GDP) measures the total value of goods and services produced within a country...',
      type: 'note',
      topic: 'Economy',
      tags: ['gdp', 'gnp', 'economics', 'indicators'],
      createdAt: '2024-01-19'
    },
    {
      id: '3',
      title: 'Monsoon Formation Formula',
      content: 'The Indian monsoon is caused by differential heating between land and sea...',
      type: 'formula',
      topic: 'Geography',
      tags: ['monsoon', 'climate', 'weather'],
      createdAt: '2024-01-18'
    }
  ]

  const topics = ['All', 'Polity', 'Economy', 'Geography', 'History', 'Environment', 'Current Affairs']
  const [selectedTopic, setSelectedTopic] = useState('All')

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTopic = selectedTopic === 'All' || item.topic === selectedTopic
    return matchesSearch && matchesTopic
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Knowledge Base</h1>
          <p className="text-slate-600">Your personal repository of study materials and notes</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search your knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <div className="flex space-x-1">
                {topics.map((topic) => (
                  <Button
                    key={topic}
                    variant={selectedTopic === topic ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTopic(topic)}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="concepts">Concepts</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="formulas">Formulas</TabsTrigger>
          <TabsTrigger value="facts">Facts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">{item.topic}</Badge>
                      <Badge variant={
                        item.type === 'concept' ? 'default' :
                        item.type === 'note' ? 'secondary' :
                        item.type === 'formula' ? 'destructive' : 'outline'
                      }>
                        {item.type}
                      </Badge>
                    </div>
                  </div>
                  <BookOpen className="w-5 h-5 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4 line-clamp-3">{item.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">{item.createdAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="concepts">
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Concept Library</h3>
            <p className="text-slate-600">Your conceptual understanding repository</p>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Personal Notes</h3>
            <p className="text-slate-600">Your study notes and observations</p>
          </div>
        </TabsContent>

        <TabsContent value="formulas">
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Formula Collection</h3>
            <p className="text-slate-600">Important formulas and calculations</p>
          </div>
        </TabsContent>

        <TabsContent value="facts">
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Key Facts</h3>
            <p className="text-slate-600">Important facts and data points</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* RAG Features */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Knowledge Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">🤖 Ask Your Knowledge Base</h4>
            <p className="text-sm text-blue-800 mb-3">
              Use natural language to query your uploaded materials and notes. The AI will provide 
              contextual answers based on your personal study materials.
            </p>
            <div className="flex space-x-2">
              <Input placeholder="Ask a question about your study materials..." className="flex-1" />
              <Button>Ask AI</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}