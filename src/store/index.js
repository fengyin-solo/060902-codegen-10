import { reactive } from 'vue'

export const store = reactive({
  conversations: [],
  selectedConversation: null,
  loveLetters: [],
  anonymousPosts: [],
  processing: false,
  error: null,

  searchVisible: false,
  searchQuery: '',
  searchFilters: {
    contact: '',
    keyword: '',
    tag: '',
    dateFrom: '',
    dateTo: ''
  },
  searchResults: [],
  scrollTarget: null,

  setConversations(convs) {
    this.conversations = convs
  },

  setLoveLetters(letters) {
    this.loveLetters = letters
  },

  setSelectedConversation(conv) {
    this.selectedConversation = conv
  },

  addAnonymousPost(post) {
    this.anonymousPosts.unshift(post)
  },

  setProcessing(val) {
    this.processing = val
  },

  setError(err) {
    this.error = err
  },

  clearAll() {
    this.conversations = []
    this.selectedConversation = null
    this.loveLetters = []
    this.error = null
  },

  toggleSearch() {
    this.searchVisible = !this.searchVisible
    if (!this.searchVisible) {
      this.clearSearch()
    }
  },

  openSearch() {
    this.searchVisible = true
  },

  closeSearch() {
    this.searchVisible = false
    this.clearSearch()
  },

  clearSearch() {
    this.searchQuery = ''
    this.searchFilters = {
      contact: '',
      keyword: '',
      tag: '',
      dateFrom: '',
      dateTo: ''
    }
    this.searchResults = []
  },

  setScrollTarget(target) {
    this.scrollTarget = target
  },

  clearScrollTarget() {
    this.scrollTarget = null
  },

  performSearch() {
    const { contact, keyword, tag, dateFrom, dateTo } = this.searchFilters
    const results = []

    for (const letter of this.loveLetters) {
      const conv = letter.conversation
      const convName = (conv.name || conv.address || '').toLowerCase()
      
      if (contact && !convName.includes(contact.toLowerCase())) {
        continue
      }

      if (tag) {
        const tagLower = tag.toLowerCase()
        const hasTag = letter.tags.some(t => t.toLowerCase().includes(tagLower))
        if (!hasTag) continue
      }

      const matchedMessages = []
      for (const msg of letter.highlightedMessages) {
        const msgBody = (msg.body || '').toLowerCase()
        const msgDate = msg.date

        if (dateFrom) {
          const fromTs = new Date(dateFrom).getTime()
          if (msgDate < fromTs) continue
        }
        if (dateTo) {
          const toTs = new Date(dateTo).getTime() + 86400000
          if (msgDate >= toTs) continue
        }

        let keywordMatch = true
        if (keyword) {
          keywordMatch = msgBody.includes(keyword.toLowerCase())
        }

        if (keywordMatch) {
          matchedMessages.push(msg)
        }
      }

      if (matchedMessages.length > 0) {
        results.push({
          letter,
          matchedMessages
        })
      }
    }

    this.searchResults = results
    return results
  },

  getAllTags() {
    const tagSet = new Set()
    for (const letter of this.loveLetters) {
      for (const tag of letter.tags) {
        tagSet.add(tag)
      }
    }
    return Array.from(tagSet)
  },

  getAllContacts() {
    const contacts = new Set()
    for (const letter of this.loveLetters) {
      const name = letter.conversation.name || letter.conversation.address
      if (name) contacts.add(name)
    }
    return Array.from(contacts)
  }
})
