"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, BookOpen, FileText, TrendingUp, AlertCircle, Users, Shield, User, Keyboard, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BookForm } from "@/components/admin/book-form"
import Link from "next/link"

interface BookOwner {
  userId: string
  userName: string
  userEmail: string
  userBookId: string
  isAvailable: boolean
  location: string | null
}

interface Book {
  id: string
  title: string
  author: string
  isbn?: string | null
  description?: string | null
  coverImage?: string | null
  stock: number
  available: number
  createdAt: string
  updatedAt: string
  owners?: BookOwner[]
}

interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "USER"
  createdAt: string
  _count: {
    userBooks: number
    borrows: number
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [addMethodDialogOpen, setAddMethodDialogOpen] = useState(false)
  const [manualInputMode, setManualInputMode] = useState(false)
  const [isbnSearchMode, setIsbnSearchMode] = useState(false)
  const [isbnInput, setIsbnInput] = useState("")
  const [isbnSearchLoading, setIsbnSearchLoading] = useState(false)
  const [isbnSearchError, setIsbnSearchError] = useState("")
  const [searchedBookData, setSearchedBookData] = useState<any>(null)
  const [editableBookData, setEditableBookData] = useState<any>(null)
  const [manualFormData, setManualFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    coverImage: "",
  })
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState("books")

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/books/admin")
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setBooks(data)
    } catch (error) {
      console.error("Error fetching books:", error)
      alert("Gagal mengambil data buku")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      alert("Gagal mengambil data user")
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    // Check if user is admin
    if (typeof window !== "undefined") {
      const userRole = localStorage.getItem("userRole")
      const userId = localStorage.getItem("userId")
      
      if (!userId) {
        // User not logged in, redirect to admin login
        router.push("/admin/login")
        return
      }
      
      if (userRole !== "ADMIN") {
        // User is not admin, redirect to catalog
        setIsAuthorized(false)
        setCheckingAuth(false)
        return
      }
      
      // User is admin, allow access
      setIsAuthorized(true)
      setCheckingAuth(false)
      fetchBooks()
      fetchUsers()
    }
  }, [router])

  const handleCreate = () => {
    setAddMethodDialogOpen(true)
  }

  const handleManualInput = () => {
    setSelectedBook(null)
    setAddMethodDialogOpen(false)
    setManualInputMode(true)
    setIsbnSearchMode(false)
    setSearchedBookData(null)
    setEditableBookData(null)
  }

  const handleIsbnSearchMode = () => {
    setAddMethodDialogOpen(false)
    setIsbnSearchMode(true)
    setManualInputMode(false)
    setIsbnInput("")
    setSearchedBookData(null)
    setEditableBookData(null)
    setIsbnSearchError("")
  }

  const handleSearchByIsbn = async (isbn: string) => {
    if (!isbn || !isbn.trim()) {
      setIsbnSearchError("ISBN tidak boleh kosong")
      return
    }

    setIsbnSearchLoading(true)
    setIsbnSearchError("")

    try {
      const response = await fetch(`/api/books/search?isbn=${encodeURIComponent(isbn.trim())}`)
      
      if (!response.ok) {
        const error = await response.json()
        setIsbnSearchError(error.error || "Buku tidak ditemukan")
        setIsbnSearchLoading(false)
        return
      }

      const data = await response.json()
      setSearchedBookData(data)
      setEditableBookData(data)
      setIsbnSearchMode(false)
      setIsbnSearchLoading(false)
    } catch (error) {
      console.error("Error searching book:", error)
      setIsbnSearchError("Gagal mencari buku")
      setIsbnSearchLoading(false)
    }
  }

  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Use manual form data if in manual input mode, otherwise use editableBookData from search
    const dataToUse = manualInputMode ? manualFormData : editableBookData

    if (!dataToUse || !dataToUse.title?.trim() || !dataToUse.author?.trim()) {
      alert("Judul dan penulis wajib diisi")
      return
    }

    setIsbnSearchLoading(true)

    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: dataToUse.title,
          author: dataToUse.author,
          isbn: dataToUse.isbn || null,
          description: dataToUse.description || "",
          coverImage: dataToUse.coverImage || "",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Gagal menyimpan buku")
        setIsbnSearchLoading(false)
        return
      }

      // Reset states and close dialog
      setManualInputMode(false)
      setIsbnSearchMode(false)
      setSearchedBookData(null)
      setEditableBookData(null)
      setIsbnInput("")
      setManualFormData({
        title: "",
        author: "",
        isbn: "",
        description: "",
        coverImage: "",
      })
      setIsbnSearchError("")
      
      fetchBooks()
      setIsbnSearchLoading(false)
      
      // Show success message
      alert("Buku berhasil ditambahkan")
    } catch (error) {
      console.error("Error saving book:", error)
      alert("Terjadi kesalahan saat menyimpan buku")
      setIsbnSearchLoading(false)
    }
  }

  const handleEdit = (book: Book) => {
    setSelectedBook(book)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus buku ini?")) {
      return
    }

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Gagal menghapus buku")
        return
      }

      fetchBooks()
    } catch (error) {
      console.error("Error deleting book:", error)
      alert("Gagal menghapus buku")
    }
  }

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "USER") => {
    const roleText = newRole === "ADMIN" ? "administrator" : "user biasa"
    if (!confirm(`Apakah Anda yakin ingin mengubah role user ini menjadi ${roleText}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Gagal mengubah role user")
        return
      }

      // Refresh users list
      fetchUsers()
    } catch (error) {
      console.error("Error updating user role:", error)
      alert("Gagal mengubah role user")
    }
  }

  // Show loading while checking authorization
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    )
  }

  // Show unauthorized message if user is not admin
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Akses Ditolak
            </CardTitle>
            <CardDescription>
              Halaman ini hanya dapat diakses oleh administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push("/admin/login")} className="w-full">
              Login sebagai Admin
            </Button>
            <Button 
              onClick={() => router.push("/catalog")} 
              variant="outline" 
              className="w-full"
            >
              Kembali ke Katalog
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Kelola buku dan manajemen user
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/borrows">
              <FileText className="mr-2 h-4 w-4" />
              Manajemen Peminjaman
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/tracking">
              <TrendingUp className="mr-2 h-4 w-4" />
              Tracking
            </Link>
          </Button>
          {activeTab === "books" && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Buku
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="books">
            <BookOpen className="mr-2 h-4 w-4" />
            Daftar Buku
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Manajemen User
          </TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Buku</CardTitle>
              <CardDescription>
                Total {books.length} buku terdaftar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Memuat data...</p>
                </div>
              ) : books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Belum ada buku terdaftar
                  </p>
                  <Button onClick={handleCreate} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Buku Pertama
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judul</TableHead>
                        <TableHead>Penulis</TableHead>
                        <TableHead>ISBN</TableHead>
                        <TableHead>Pemilik</TableHead>
                        <TableHead>Kota</TableHead>
                        <TableHead>Stok</TableHead>
                        <TableHead>Tersedia</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {books.map((book) => (
                        <TableRow key={book.id}>
                          <TableCell className="font-medium">
                            {book.title}
                          </TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell>{book.isbn || "-"}</TableCell>
                          <TableCell>
                            {book.owners && book.owners.length > 0 ? (
                              <div className="space-y-1">
                                {book.owners.map((owner, idx) => (
                                  <div key={owner.userBookId} className="text-sm">
                                    <span className="font-medium">{owner.userName}</span>
                                    {!owner.isAvailable && (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        Dipinjam
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {book.owners && book.owners.length > 0 ? (
                              <div className="space-y-1">
                                {book.owners.map((owner) => (
                                  <div key={owner.userBookId} className="text-sm">
                                    {owner.location || (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{book.stock}</TableCell>
                          <TableCell>
                            <span
                              className={
                                book.available === 0
                                  ? "text-destructive font-medium"
                                  : ""
                              }
                            >
                              {book.available}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(book)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(book.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen User</CardTitle>
              <CardDescription>
                Kelola role user dan assign administrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Memuat data...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Belum ada user terdaftar</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Koleksi Buku</TableHead>
                        <TableHead>Total Peminjaman</TableHead>
                        <TableHead>Tanggal Daftar</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.role === "ADMIN" ? "default" : "secondary"}
                              className="flex items-center gap-1 w-fit"
                            >
                              {user.role === "ADMIN" ? (
                                <Shield className="h-3 w-3" />
                              ) : (
                                <User className="h-3 w-3" />
                              )}
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user._count.userBooks}</TableCell>
                          <TableCell>{user._count.borrows}</TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {user.role === "ADMIN" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRoleChange(user.id, "USER")}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  Set User
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleRoleChange(user.id, "ADMIN")}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Set Admin
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Pilihan Metode Tambah Buku */}
      <Dialog open={addMethodDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddMethodDialogOpen(false)
          setManualInputMode(false)
          setIsbnSearchMode(false)
          setSearchedBookData(null)
          setEditableBookData(null)
          setIsbnInput("")
          setIsbnSearchError("")
          setManualFormData({
            title: "",
            author: "",
            isbn: "",
            description: "",
            coverImage: "",
          })
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Buku Baru</DialogTitle>
            <DialogDescription>
              Pilih metode untuk menambahkan buku baru
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={handleIsbnSearchMode}
              className="h-auto p-6 flex flex-col items-start gap-3"
              variant="outline"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">Cari dengan ISBN</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Masukkan ISBN untuk mencari informasi buku secara otomatis
                  </div>
                </div>
              </div>
            </Button>
            <Button
              onClick={handleManualInput}
              className="h-auto p-6 flex flex-col items-start gap-3"
              variant="outline"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Keyboard className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">Input Manual</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    Masukkan informasi buku secara manual
                  </div>
                </div>
              </div>
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setAddMethodDialogOpen(false)
                setManualInputMode(false)
                setIsbnSearchMode(false)
                setSearchedBookData(null)
                setEditableBookData(null)
                setIsbnInput("")
                setIsbnSearchError("")
                setManualFormData({
                  title: "",
                  author: "",
                  isbn: "",
                  description: "",
                  coverImage: "",
                })
              }}
            >
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Form Tambah Buku */}
      <Dialog open={(!addMethodDialogOpen && (manualInputMode || isbnSearchMode || editableBookData))} onOpenChange={(open) => {
        if (!open) {
          setManualInputMode(false)
          setIsbnSearchMode(false)
          setSearchedBookData(null)
          setEditableBookData(null)
          setIsbnInput("")
          setIsbnSearchError("")
          setManualFormData({
            title: "",
            author: "",
            isbn: "",
            description: "",
            coverImage: "",
          })
          // If closing from form, also reset addMethodDialogOpen to allow reopening
          if (!manualInputMode && !isbnSearchMode && !editableBookData) {
            setAddMethodDialogOpen(false)
          }
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tambah Buku Baru</DialogTitle>
            <DialogDescription>
              {manualInputMode 
                ? "Masukkan informasi buku secara manual"
                : isbnSearchMode
                ? "Masukkan ISBN untuk mencari informasi buku secara otomatis"
                : editableBookData
                ? "Lengkapi informasi dan simpan buku"
                : "Masukkan informasi buku"}
            </DialogDescription>
          </DialogHeader>

          {isbnSearchMode && !editableBookData ? (
            <form onSubmit={(e) => {
              e.preventDefault()
              handleSearchByIsbn(isbnInput)
            }} className="space-y-4">
              <div>
                <Label htmlFor="isbn-search">ISBN</Label>
                <Input
                  id="isbn-search"
                  type="text"
                  value={isbnInput}
                  onChange={(e) => {
                    setIsbnInput(e.target.value)
                    setIsbnSearchError("")
                  }}
                  placeholder="Masukkan ISBN (10 atau 13 digit)"
                  disabled={isbnSearchLoading}
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sistem akan mencari informasi buku dari Open Library dan Google Books
                </p>
              </div>
              {isbnSearchError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {isbnSearchError}
                </div>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsbnSearchMode(false)
                    setAddMethodDialogOpen(true)
                    setIsbnInput("")
                    setIsbnSearchError("")
                  }}
                  disabled={isbnSearchLoading}
                >
                  Kembali
                </Button>
                <Button type="submit" disabled={isbnSearchLoading || !isbnInput.trim()}>
                  {isbnSearchLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mencari...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Cari Buku
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : manualInputMode ? (
            <form onSubmit={handleSubmitBook}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="manual-title">
                    Judul Buku <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="manual-title"
                    value={manualFormData.title}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, title: e.target.value })
                    }
                    placeholder="Masukkan judul buku"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="manual-author">
                    Penulis <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="manual-author"
                    value={manualFormData.author}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, author: e.target.value })
                    }
                    placeholder="Masukkan nama penulis"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="manual-isbn">ISBN</Label>
                  <Input
                    id="manual-isbn"
                    value={manualFormData.isbn}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, isbn: e.target.value })
                    }
                    placeholder="Masukkan ISBN (opsional)"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-description">Deskripsi</Label>
                  <Textarea
                    id="manual-description"
                    value={manualFormData.description}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, description: e.target.value })
                    }
                    placeholder="Masukkan deskripsi buku (opsional)"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="manual-coverImage">URL Cover Buku</Label>
                  <Input
                    id="manual-coverImage"
                    type="url"
                    value={manualFormData.coverImage}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, coverImage: e.target.value })
                    }
                    placeholder="https://example.com/cover.jpg (opsional)"
                  />
                </div>
                {manualFormData.coverImage && (
                  <div className="flex justify-center">
                    <img
                      src={manualFormData.coverImage}
                      alt="Preview"
                      className="h-32 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setManualInputMode(false)
                    setAddMethodDialogOpen(true)
                    setManualFormData({
                      title: "",
                      author: "",
                      isbn: "",
                      description: "",
                      coverImage: "",
                    })
                  }}
                  disabled={isbnSearchLoading}
                >
                  Kembali
                </Button>
                <Button type="submit" disabled={isbnSearchLoading}>
                  {isbnSearchLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : editableBookData ? (
            <form onSubmit={handleSubmitBook}>
              <div className="space-y-4">
                {editableBookData.coverImage && (
                  <div className="flex justify-center">
                    <img
                      src={editableBookData.coverImage}
                      alt={editableBookData.title}
                      className="h-32 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="edit-title">
                    Judul Buku <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    value={editableBookData.title}
                    onChange={(e) =>
                      setEditableBookData({ ...editableBookData, title: e.target.value })
                    }
                    placeholder="Masukkan judul buku"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-author">
                    Penulis <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-author"
                    value={editableBookData.author}
                    onChange={(e) =>
                      setEditableBookData({ ...editableBookData, author: e.target.value })
                    }
                    placeholder="Masukkan nama penulis"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-isbn">ISBN</Label>
                  <Input
                    id="edit-isbn"
                    value={editableBookData.isbn}
                    onChange={(e) =>
                      setEditableBookData({ ...editableBookData, isbn: e.target.value })
                    }
                    placeholder="Masukkan ISBN (opsional)"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Deskripsi</Label>
                  <Textarea
                    id="edit-description"
                    value={editableBookData.description || ""}
                    onChange={(e) =>
                      setEditableBookData({ ...editableBookData, description: e.target.value })
                    }
                    placeholder="Masukkan deskripsi buku (opsional)"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-coverImage">URL Cover Buku</Label>
                  <Input
                    id="edit-coverImage"
                    type="url"
                    value={editableBookData.coverImage || ""}
                    onChange={(e) =>
                      setEditableBookData({ ...editableBookData, coverImage: e.target.value })
                    }
                    placeholder="https://example.com/cover.jpg (opsional)"
                  />
                  {editableBookData.coverImage && (
                    <div className="mt-2 flex justify-center">
                      <img
                        src={editableBookData.coverImage}
                        alt="Preview"
                        className="h-24 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditableBookData(null)
                    setSearchedBookData(null)
                    setIsbnInput("")
                    setIsbnSearchMode(true)
                    setIsbnSearchError("")
                  }}
                  disabled={isbnSearchLoading}
                >
                  Cari Lagi
                </Button>
                <Button type="submit" disabled={isbnSearchLoading}>
                  {isbnSearchLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <BookForm
        open={formOpen}
        onOpenChange={setFormOpen}
        book={selectedBook}
        onSuccess={fetchBooks}
      />
    </div>
  )
}
