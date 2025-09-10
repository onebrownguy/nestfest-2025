'use client'

/**
 * Shark Tank Mode Component
 * 
 * Features:
 * - Live deal making during presentations
 * - Real-time judge offer tracking
 * - Audience investment pool simulation
 * - Interactive pitch evaluation
 * - Deal negotiation workflows
 * - Investment tracking and analytics
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from './useWebSocket'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth/hooks'
import type {
  EventSession,
  Submission,
  SharkTankOffer,
  DealNegotiation,
  NegotiationMessage,
  AudienceInvestmentPool,
  User
} from '@/types'

interface SharkTankModeProps {
  session: EventSession
  currentSubmission: Submission | null
  judges: User[]
  isJudge?: boolean
  isAdmin?: boolean
}

interface OfferFormData {
  offerType: 'equity' | 'loan' | 'partnership' | 'mentorship'
  amount?: number
  equityPercentage?: number
  conditions: string[]
}

export function SharkTankMode({
  session,
  currentSubmission,
  judges,
  isJudge = false,
  isAdmin = false
}: SharkTankModeProps) {
  const { user } = useAuth()
  const { isConnected, emit, onSharkTankOffer } = useWebSocket()
  
  const [offers, setOffers] = useState<SharkTankOffer[]>([])
  const [negotiations, setNegotiations] = useState<DealNegotiation[]>([])
  const [audiencePool, setAudiencePool] = useState<AudienceInvestmentPool | null>(null)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showNegotiationModal, setShowNegotiationModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<SharkTankOffer | null>(null)
  const [offerForm, setOfferForm] = useState<OfferFormData>({
    offerType: 'equity',
    conditions: []
  })
  const [negotiationMessage, setNegotiationMessage] = useState('')
  const [userInvestment, setUserInvestment] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Listen for offer updates
  useEffect(() => {
    const unsubscribe = onSharkTankOffer((offer: SharkTankOffer) => {
      setOffers(prev => {
        const existingIndex = prev.findIndex(o => o.id === offer.id)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = offer
          return updated
        }
        return [...prev, offer]
      })

      // Show toast for new offers
      if (offer.status === 'pending') {
        showToast.info(`New ${offer.offerType} offer from ${getJudgeName(offer.judgeId)}`)
      }
    })

    return unsubscribe
  }, [onSharkTankOffer])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [negotiations])

  // Get judge name by ID
  const getJudgeName = useCallback((judgeId: string): string => {
    const judge = judges.find(j => j.id === judgeId)
    return judge?.name || 'Unknown Judge'
  }, [judges])

  // Submit offer
  const handleSubmitOffer = useCallback(async () => {
    if (!currentSubmission || !isJudge || !user) return

    const offer: Omit<SharkTankOffer, 'id' | 'timestamp'> = {
      sessionId: session.id,
      submissionId: currentSubmission.id,
      judgeId: user.id,
      offerType: offerForm.offerType,
      amount: offerForm.amount,
      equityPercentage: offerForm.equityPercentage,
      conditions: offerForm.conditions,
      status: 'pending'
    }

    emit('shark_tank_offer', offer)
    
    setShowOfferModal(false)
    setOfferForm({
      offerType: 'equity',
      conditions: []
    })
    
    showToast.success('Offer submitted successfully!')
  }, [currentSubmission, isJudge, user, session.id, offerForm, emit])

  // Accept/decline offer
  const handleOfferResponse = useCallback((offerId: string, response: 'accepted' | 'declined') => {
    emit('offer_response', { offerId, response })
    showToast.success(`Offer ${response}!`)
  }, [emit])

  // Start negotiation
  const handleStartNegotiation = useCallback((offer: SharkTankOffer) => {
    setSelectedOffer(offer)
    setShowNegotiationModal(true)
    
    emit('start_negotiation', { offerId: offer.id })
  }, [emit])

  // Send negotiation message
  const handleSendMessage = useCallback(() => {
    if (!selectedOffer || !negotiationMessage.trim() || !user) return

    const message: Omit<NegotiationMessage, 'id' | 'timestamp'> = {
      senderId: user.id,
      message: negotiationMessage,
      offerUpdate: undefined // Could include offer modifications
    }

    emit('negotiation_message', {
      offerId: selectedOffer.id,
      message
    })

    setNegotiationMessage('')
  }, [selectedOffer, negotiationMessage, user, emit])

  // Invest in audience pool
  const handleAudienceInvestment = useCallback((amount: number) => {
    if (!currentSubmission || amount <= 0 || amount > 1000) return

    emit('audience_investment', {
      sessionId: session.id,
      submissionId: currentSubmission.id,
      amount,
      userId: user?.id
    })

    setUserInvestment(prev => prev + amount)
    showToast.success(`Invested $${amount} successfully!`)
  }, [currentSubmission, session.id, user, emit])

  // Filter offers for current submission
  const currentOffers = offers.filter(offer => offer.submissionId === currentSubmission?.id)

  // Calculate investment statistics
  const investmentStats = audiencePool?.submissions[currentSubmission?.id || ''] || {
    amount: 0,
    percentage: 0,
    backers: 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              🦈 Shark Tank Mode
            </h1>
            <p className="text-purple-100 mt-1">
              {currentSubmission ? `Pitching: ${currentSubmission.title}` : 'No active pitch'}
            </p>
          </div>
          
          {isJudge && currentSubmission && (
            <Button
              onClick={() => setShowOfferModal(true)}
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              Make Offer
            </Button>
          )}
        </div>
      </div>

      {/* Current Pitch Panel */}
      {currentSubmission && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submission Details */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{currentSubmission.title}</h2>
            <p className="text-gray-600 mb-6">{currentSubmission.description}</p>
            
            {/* Live Offers */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Live Offers ({currentOffers.length})</h3>
              
              {currentOffers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🤝</div>
                  <p>No offers yet. Judges can make offers above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentOffers.map(offer => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      judgeName={getJudgeName(offer.judgeId)}
                      canRespond={!isJudge && !isAdmin}
                      canNegotiate={true}
                      onAccept={() => handleOfferResponse(offer.id, 'accepted')}
                      onDecline={() => handleOfferResponse(offer.id, 'declined')}
                      onNegotiate={() => handleStartNegotiation(offer)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Investment Panel */}
          <div className="space-y-4">
            {/* Judge Panel */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Judges Panel</h3>
              <div className="space-y-2">
                {judges.map(judge => {
                  const judgeOffers = currentOffers.filter(o => o.judgeId === judge.id)
                  const hasOffer = judgeOffers.length > 0
                  const latestOffer = judgeOffers[judgeOffers.length - 1]
                  
                  return (
                    <div
                      key={judge.id}
                      className={`p-3 rounded-lg border ${
                        hasOffer ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-700">
                              {judge.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{judge.name}</span>
                        </div>
                        
                        {hasOffer ? (
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-700">
                              {latestOffer.status === 'pending' ? '🤝 Offered' :
                               latestOffer.status === 'accepted' ? '✅ Deal!' :
                               latestOffer.status === 'declined' ? '❌ Declined' : '🔄 Counter'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {latestOffer.amount && `$${latestOffer.amount.toLocaleString()}`}
                              {latestOffer.equityPercentage && ` for ${latestOffer.equityPercentage}%`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Thinking...</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Audience Investment Pool */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Audience Investment Pool</h3>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${investmentStats.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {investmentStats.backers} backers ({investmentStats.percentage.toFixed(1)}%)
                  </div>
                </div>

                {/* Investment Controls */}
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50].map(amount => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAudienceInvestment(amount)}
                      disabled={!isConnected}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Custom amount"
                    min="1"
                    max="1000"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const amount = parseInt(e.currentTarget.value)
                        if (amount > 0) {
                          handleAudienceInvestment(amount)
                          e.currentTarget.value = ''
                        }
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Custom amount"]') as HTMLInputElement
                      const amount = parseInt(input.value)
                      if (amount > 0) {
                        handleAudienceInvestment(amount)
                        input.value = ''
                      }
                    }}
                  >
                    Invest
                  </Button>
                </div>

                {userInvestment > 0 && (
                  <div className="text-sm text-blue-600 text-center">
                    You've invested ${userInvestment} so far
                  </div>
                )}
              </div>
            </div>

            {/* Deal Statistics */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Session Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Offers:</span>
                  <span className="font-medium">{offers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deals Closed:</span>
                  <span className="font-medium">
                    {offers.filter(o => o.status === 'accepted').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Active Negotiations:</span>
                  <span className="font-medium">{negotiations.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Make Offer Modal */}
      <Modal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        title="Make an Offer"
      >
        <div className="space-y-4">
          {/* Offer Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Offer Type</label>
            <select
              value={offerForm.offerType}
              onChange={(e) => setOfferForm(prev => ({ ...prev, offerType: e.target.value as any }))}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="equity">Equity Investment</option>
              <option value="loan">Loan</option>
              <option value="partnership">Partnership</option>
              <option value="mentorship">Mentorship</option>
            </select>
          </div>

          {/* Amount */}
          {offerForm.offerType !== 'mentorship' && (
            <div>
              <label className="block text-sm font-medium mb-2">Amount ($)</label>
              <Input
                type="number"
                value={offerForm.amount || ''}
                onChange={(e) => setOfferForm(prev => ({ 
                  ...prev, 
                  amount: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="Enter investment amount"
              />
            </div>
          )}

          {/* Equity Percentage */}
          {offerForm.offerType === 'equity' && (
            <div>
              <label className="block text-sm font-medium mb-2">Equity Percentage (%)</label>
              <Input
                type="number"
                value={offerForm.equityPercentage || ''}
                onChange={(e) => setOfferForm(prev => ({ 
                  ...prev, 
                  equityPercentage: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="Enter equity percentage"
                min="1"
                max="100"
              />
            </div>
          )}

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium mb-2">Conditions</label>
            <textarea
              value={offerForm.conditions.join('\n')}
              onChange={(e) => setOfferForm(prev => ({ 
                ...prev, 
                conditions: e.target.value.split('\n').filter(c => c.trim()) 
              }))}
              placeholder="Enter conditions (one per line)"
              className="w-full border border-gray-300 rounded-lg p-2"
              rows={3}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowOfferModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitOffer}
              className="flex-1"
              disabled={
                (offerForm.offerType !== 'mentorship' && !offerForm.amount) ||
                (offerForm.offerType === 'equity' && !offerForm.equityPercentage)
              }
            >
              Submit Offer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Negotiation Modal */}
      <Modal
        isOpen={showNegotiationModal}
        onClose={() => setShowNegotiationModal(false)}
        title="Deal Negotiation"
        size="lg"
      >
        {selectedOffer && (
          <div className="space-y-4">
            {/* Offer Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Original Offer</h4>
              <div className="text-sm space-y-1">
                <div>Type: {selectedOffer.offerType}</div>
                {selectedOffer.amount && <div>Amount: ${selectedOffer.amount.toLocaleString()}</div>}
                {selectedOffer.equityPercentage && <div>Equity: {selectedOffer.equityPercentage}%</div>}
                <div>From: {getJudgeName(selectedOffer.judgeId)}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {/* Placeholder for negotiation messages */}
              <div className="text-center text-gray-500 py-8">
                Negotiation messages will appear here
              </div>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex space-x-2">
              <Input
                value={negotiationMessage}
                onChange={(e) => setNegotiationMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage()
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!negotiationMessage.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}

// Offer Card Component
function OfferCard({
  offer,
  judgeName,
  canRespond,
  canNegotiate,
  onAccept,
  onDecline,
  onNegotiate
}: {
  offer: SharkTankOffer
  judgeName: string
  canRespond: boolean
  canNegotiate: boolean
  onAccept: () => void
  onDecline: () => void
  onNegotiate: () => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-yellow-200 bg-yellow-50'
      case 'accepted': return 'border-green-200 bg-green-50'
      case 'declined': return 'border-red-200 bg-red-50'
      case 'countered': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'accepted': return '✅'
      case 'declined': return '❌'
      case 'countered': return '🔄'
      default: return '❓'
    }
  }

  return (
    <motion.div
      className={`border rounded-lg p-4 ${getStatusColor(offer.status)}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getStatusIcon(offer.status)}</span>
            <h4 className="font-semibold">{judgeName}</h4>
            <span className="text-sm text-gray-500 capitalize">
              {offer.offerType} Offer
            </span>
          </div>
          
          <div className="space-y-1 text-sm">
            {offer.amount && (
              <div>💰 ${offer.amount.toLocaleString()}</div>
            )}
            {offer.equityPercentage && (
              <div>📊 {offer.equityPercentage}% equity</div>
            )}
            {offer.conditions.length > 0 && (
              <div>
                📋 Conditions:
                <ul className="list-disc list-inside ml-4 mt-1">
                  {offer.conditions.map((condition, index) => (
                    <li key={index} className="text-xs">{condition}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {offer.status === 'pending' && canRespond && (
          <div className="flex space-x-2 ml-4">
            <Button
              size="sm"
              variant="primary"
              onClick={onAccept}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDecline}
            >
              Decline
            </Button>
            {canNegotiate && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onNegotiate}
              >
                Counter
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mt-3">
        {new Date(offer.timestamp).toLocaleTimeString()}
      </div>
    </motion.div>
  )
}