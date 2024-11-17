import { useState } from 'react'
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { ScrollArea } from "../components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { FileSpreadsheet, Plus, Search } from 'lucide-react'
import BackButton from '../components/BackButton';
// Dummy data for connected sheets
const connectedSheets = [
  { id: 1, name: "Sales Report 2023", tabs: ["Overview", "Q1", "Q2", "Q3", "Q4"] },
  { id: 2, name: "Employee Directory", tabs: ["All Employees", "Departments", "Roles", "All Employees1", "All Employees2", "All Employees3"] },
  { id: 3, name: "Project Tracker", tabs: ["Active Projects", "Completed", "Pipeline"] },
  { id: 4, name: "Budget Planner", tabs: ["Annual Budget", "Monthly Breakdown", "Categories"] },
]


// Dummy headers for demonstration
const dummyHeaders = ["ID", "Name", "Email", "Department", "Position", "Start Date", "Salary"]

// Dummy values for mapping (you would fetch these from your actual data source)
const dummyValues = ["User ID", "Full Name", "Email Address", "Team", "Job Title", "Hire Date", "Compensation"]

export default function SheetManagement({ onNavigate }) {
  const [view, setView] = useState('main')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSheet, setSelectedSheet] = useState(null)
  const [selectedTab, setSelectedTab] = useState(null)
  const [newSheetName, setNewSheetName] = useState('')
  const [showHeaders, setShowHeaders] = useState(false)
  const [headerMappings, setHeaderMappings] = useState({})
  const [isCreatingSheet, setIsCreatingSheet] = useState(false)
  const [isCreatingTab, setIsCreatingTab] = useState(false)
  const [newTabName, setNewTabName] = useState('')
  const [newRoleName, setNewRoleName] = useState('')

  const handleSheetSelect = (sheet) => {
    setSelectedSheet(sheet)
    setSelectedTab(null)
    setShowHeaders(false)
    setHeaderMappings({})
  }

  const handleTabSelect = (tab) => {
    setSelectedTab(tab)
    setShowHeaders(true)
    setHeaderMappings({})
  }

  const handleAddNewSheet = (e) => {
    e.preventDefault()
    console.log(`Adding new sheet: ${newSheetName}`)
    setNewSheetName('')
    setIsCreatingSheet(false)
  }

  const handleAddNewTab = (e) => {
    e.preventDefault()
    console.log(`Adding new tab: ${newTabName} to sheet: ${selectedSheet.name}`)
    setNewTabName('')
    setIsCreatingTab(false)
    setSelectedSheet(null)
    setSelectedTab(null)
    setShowHeaders(false)
    setHeaderMappings({})
  }

  const handleCreateNewRole = (e) => {
    e.preventDefault()
    console.log(`Creating new role: ${newRoleName}`)
    setNewRoleName('')
    setView('main')
  }

  const handleHeaderMapping = (header, value) => {
    setHeaderMappings(prev => ({ ...prev, [header]: value }))
  }

  const handleSubmitMapping = () => {
    console.log(`Submitting header mappings for ${selectedSheet.name} - ${selectedTab}:`, headerMappings)
    setSelectedSheet(null)
    setSelectedTab(null)
    setShowHeaders(false)
    setHeaderMappings({})
  }

  const filteredSheets = connectedSheets.filter(sheet =>
    sheet.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <BackButton onNavigateHome={onNavigate} />
      <h1 className="text-2xl font-bold mb-6">Connected Sheet Management System</h1>

      {view === 'main' && (
        <div className="space-y-4 flex flex-col">
          <Button onClick={() => setView('connect')} className="bg-[#1a2e4a]">Connect Existing Sheets</Button>
          <Button onClick={() => setView('create')} className="bg-[#1a2e4a]">Create New Role</Button>
        </div>
      )}

      {view === 'connect' && (
        <div className="space-y-4">
          <Button onClick={() => setView('main')} variant="outline" className="mb-2"><span>&larr;</span></Button>
          <div className="relative max-w-md">
            <Label htmlFor="search" className="sr-only">Search sheets</Label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
            <Input
              id="search"
              placeholder="Search sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSheets.map((sheet) => (
              <Card key={sheet.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => handleSheetSelect(sheet)}>
                <CardHeader className="p-0 m-0">
                  <CardTitle className="text-sm flex items-center p-3 m-0">
                    <FileSpreadsheet className="mr-2 h-6 w-6" />
                    {sheet.name}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
            <Card className="border-dashed hover:shadow-lg transition-all cursor-pointer" onClick={() => setIsCreatingSheet(true)}>
              <CardHeader className="p-3 m-0">
                <CardTitle className="text-sm flex items-center justify-center text-muted-foreground">
                  <Plus className="mr-2 h-6 w-6" />
                  Add New Sheet
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="space-y-4">
          <Button onClick={() => setView('main')} variant="outline" className="mb-2"><span>&larr;</span></Button>
          <form onSubmit={handleCreateNewRole} className="space-y-4">
            <div>
              <Label htmlFor="newRoleName bg-[#1a2e4a]">New Role Name</Label>
              <Input
                id="newRoleName"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Enter new role name"
              />
            </div>
            <Button className="bg-[#1a2e4a]" type="submit">Create New Role</Button>
          </form>
        </div>
      )}

      <Dialog open={isCreatingSheet} onOpenChange={setIsCreatingSheet}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sheet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNewSheet} className="space-y-4">
            <div>
              <Label htmlFor="newSheetName">Sheet Name</Label>
              <Input
                id="newSheetName"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                placeholder="Enter new sheet name"
              />
            </div>
            <Button type="submit">Create Sheet</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSheet} onOpenChange={(open) => !open && setSelectedSheet(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedSheet?.name}</DialogTitle>
          </DialogHeader>
          {selectedSheet && !selectedTab && (
            <div className="py-4">
              <h3 className="font-semibold mb-2">Select a Tab</h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {selectedSheet.tabs.map((tab) => (
                    <Button
                      key={tab}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleTabSelect(tab)}
                    >
                      {tab}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <Button onClick={() => setIsCreatingTab(true)} className="bg-[#1a2e4a] mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create New Tab
              </Button>
            </div>
          )}
          {selectedTab && showHeaders && (
            <div className="py-4">
              <h3 className="font-semibold mb-2 ">Headers in {selectedTab}</h3>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {dummyHeaders.map((header, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{header}</span>
                      <Select
                        value={headerMappings[header] || ''}
                        onValueChange={(value) => handleHeaderMapping(header, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a value" />
                        </SelectTrigger>
                        <SelectContent>
                          {dummyValues.map((value, i) => (
                            <SelectItem key={i} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button onClick={handleSubmitMapping} className="mt-4 w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingTab} onOpenChange={setIsCreatingTab}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tab</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNewTab} className="space-y-4">
            <div>
              <Label htmlFor="newTabName">Tab Name</Label>
              <Input
                id="newTabName"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="Enter new tab name"
              />
            </div>
            <Button type="submit">Create and Update</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}