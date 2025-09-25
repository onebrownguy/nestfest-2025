'use client'

import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  TextField,
  Slider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Rating,
  Divider,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fab
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  AttachFile as AttachFileIcon,
  PlayArrow as PlayArrowIcon,
  PictureAsPdf as PdfIcon,
  Link as LinkIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Star as StarIcon,
  Send as SendIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Feedback as FeedbackIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Timer as TimerIcon,
  Comment as CommentIcon
} from '@mui/icons-material'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface EvaluationCriteria {
  id: string
  name: string
  description: string
  weight: number
  maxScore: number
}

interface TeamMember {
  name: string
  role: string
  university: string
  email: string
}

interface Submission {
  id: string
  teamName: string
  competition: string
  title: string
  description: string
  submittedAt: string
  teamMembers: TeamMember[]
  attachments: {
    type: 'pdf' | 'video' | 'link' | 'code'
    name: string
    url: string
    size?: string
  }[]
  criteria: EvaluationCriteria[]
}

const steps = [
  'Review Submission',
  'Evaluate Criteria',
  'Provide Feedback',
  'Submit Final Score'
]

export default function JudgeEvaluationPage() {
  const params = useParams()
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
  const [scores, setScores] = useState<{ [key: string]: number }>({})
  const [feedback, setFeedback] = useState('')
  const [finalComments, setFinalComments] = useState('')
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  // Mock submission data
  const submission: Submission = {
    id: params.submissionId as string,
    teamName: 'InnovateTech Solutions',
    competition: 'Tech Innovation Challenge 2025',
    title: 'AI-Powered Healthcare Assistant for Rural Communities',
    description: 'Our solution leverages artificial intelligence and mobile technology to provide healthcare guidance and emergency response coordination for underserved rural communities. The system includes a chatbot interface, telemedicine capabilities, and integration with local healthcare providers.',
    submittedAt: '2025-09-20T10:30:00Z',
    teamMembers: [
      {
        name: 'Alex Chen',
        role: 'Team Lead & AI Engineer',
        university: 'Stanford University',
        email: 'achen@stanford.edu'
      },
      {
        name: 'Maria Rodriguez',
        role: 'Mobile Developer',
        university: 'UC Berkeley',
        email: 'mrodriguez@berkeley.edu'
      },
      {
        name: 'David Kim',
        role: 'Healthcare Specialist',
        university: 'UCSF',
        email: 'dkim@ucsf.edu'
      }
    ],
    attachments: [
      {
        type: 'pdf',
        name: 'Project Proposal.pdf',
        url: '#',
        size: '2.3 MB'
      },
      {
        type: 'video',
        name: 'Demo Video.mp4',
        url: '#',
        size: '15.7 MB'
      },
      {
        type: 'link',
        name: 'Live Prototype',
        url: 'https://healthassist-demo.app'
      },
      {
        type: 'code',
        name: 'GitHub Repository',
        url: 'https://github.com/innovatetech/healthassist'
      }
    ],
    criteria: [
      {
        id: 'innovation',
        name: 'Innovation',
        description: 'Originality and creativity of the solution approach',
        weight: 30,
        maxScore: 10
      },
      {
        id: 'technical',
        name: 'Technical Implementation',
        description: 'Quality of technical execution and architecture',
        weight: 25,
        maxScore: 10
      },
      {
        id: 'impact',
        name: 'Market Potential & Impact',
        description: 'Potential for real-world impact and market viability',
        weight: 20,
        maxScore: 10
      },
      {
        id: 'presentation',
        name: 'Presentation Quality',
        description: 'Clarity and effectiveness of project presentation',
        weight: 15,
        maxScore: 10
      },
      {
        id: 'collaboration',
        name: 'Team Collaboration',
        description: 'Evidence of effective teamwork and role distribution',
        weight: 10,
        maxScore: 10
      }
    ]
  }

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores(prev => ({ ...prev, [criteriaId]: value }))
  }

  const getTotalScore = () => {
    let totalWeightedScore = 0
    let totalWeight = 0

    submission.criteria.forEach(criteria => {
      const score = scores[criteria.id] || 0
      totalWeightedScore += (score / criteria.maxScore) * criteria.weight
      totalWeight += criteria.weight
    })

    return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 10 : 0
  }

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <PdfIcon />
      case 'video': return <PlayArrowIcon />
      case 'link': return <LinkIcon />
      case 'code': return <CodeIcon />
      default: return <DescriptionIcon />
    }
  }

  const isEvaluationComplete = () => {
    return submission.criteria.every(criteria => scores[criteria.id] > 0)
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/judge')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            NEST FEST 2025 - Judge Panel
          </Typography>
          <Chip label="Evaluation Mode" color="primary" size="small" />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Submission Details */}
          <div className="col-span-12 lg:col-span-4">
            <Card elevation={2} sx={{ position: 'sticky', top: 20 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    {submission.teamName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {submission.teamName}
                    </Typography>
                    <Chip label={submission.competition} size="small" color="secondary" />
                  </Box>
                </Box>

                <Typography variant="h6" gutterBottom>
                  {submission.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {submission.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Team Members */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  <GroupIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Team Members ({submission.teamMembers.length})
                </Typography>

                <List dense>
                  {submission.teamMembers.map((member, idx) => (
                    <ListItem key={idx} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={member.name}
                        secondary={`${member.role} • ${member.university}`}
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Attachments */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  <AttachFileIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Attachments
                </Typography>

                <List dense>
                  {submission.attachments.map((attachment, idx) => (
                    <ListItem key={idx} sx={{ px: 0 }} component="a" href={attachment.url} target="_blank">
                      <ListItemIcon>
                        {getAttachmentIcon(attachment.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={attachment.name}
                        secondary={attachment.size}
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Current Score */}
                <Box textAlign="center" p={2} bgcolor="primary.50" borderRadius={2}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {getTotalScore().toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Total Score
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getTotalScore() * 10}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Evaluation Interface */}
          <div className="col-span-12 lg:col-span-8">
            <Card elevation={2}>
              <CardContent>
                {/* Progress Stepper */}
                <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 4 }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Step Content */}
                {activeStep === 0 && (
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Review Submission Materials
                    </Typography>

                    <Alert severity="info" sx={{ mb: 3 }}>
                      Please thoroughly review all submission materials before proceeding with evaluation.
                    </Alert>

                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                          <PdfIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            Project Proposal
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Comprehensive project documentation and technical specifications
                          </Typography>
                          <Button variant="outlined" startIcon={<DescriptionIcon />}>
                            View Document
                          </Button>
                        </Paper>
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                          <PlayArrowIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            Demo Video
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Live demonstration of the working prototype and key features
                          </Typography>
                          <Button variant="outlined" startIcon={<PlayArrowIcon />}>
                            Watch Demo
                          </Button>
                        </Paper>
                      </div>
                    </div>

                    <Box display="flex" justifyContent="flex-end" mt={4}>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        size="large"
                      >
                        Start Evaluation
                      </Button>
                    </Box>
                  </Box>
                )}

                {activeStep === 1 && (
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Evaluate Criteria
                    </Typography>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      Rate each criterion based on the submission materials. Your scores will be weighted automatically.
                    </Typography>

                    {submission.criteria.map((criteria) => (
                      <Card key={criteria.id} variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                            <Typography variant="h6" fontWeight="bold">
                              {criteria.name} ({criteria.weight}% weight)
                            </Typography>
                            <Chip
                              label={`${scores[criteria.id] || 0}/${criteria.maxScore}`}
                              color={scores[criteria.id] > 0 ? 'primary' : 'default'}
                            />
                          </Box>

                          <Typography variant="body2" color="text.secondary" paragraph>
                            {criteria.description}
                          </Typography>

                          <Box sx={{ px: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Score: {scores[criteria.id] || 0}
                            </Typography>
                            <Slider
                              value={scores[criteria.id] || 0}
                              onChange={(_, value) => handleScoreChange(criteria.id, value as number)}
                              step={0.5}
                              marks
                              min={0}
                              max={criteria.maxScore}
                              valueLabelDisplay="auto"
                              color="primary"
                            />
                          </Box>

                          <Box mt={2}>
                            <Rating
                              value={scores[criteria.id] || 0}
                              onChange={(_, value) => handleScoreChange(criteria.id, value || 0)}
                              max={criteria.maxScore}
                              precision={0.5}
                              size="large"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}

                    <Box display="flex" justifyContent="space-between" mt={4}>
                      <Button onClick={handleBack}>
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!isEvaluationComplete()}
                        size="large"
                      >
                        Continue to Feedback
                      </Button>
                    </Box>
                  </Box>
                )}

                {activeStep === 2 && (
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Provide Detailed Feedback
                    </Typography>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      Your feedback will help the team understand their strengths and areas for improvement.
                    </Typography>

                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      label="Detailed Feedback"
                      placeholder="Provide constructive feedback on the team's submission..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      sx={{ mb: 3 }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Recommendations for Improvement"
                      placeholder="Specific suggestions for how the team could enhance their solution..."
                      value={finalComments}
                      onChange={(e) => setFinalComments(e.target.value)}
                    />

                    <Box display="flex" justifyContent="space-between" mt={4}>
                      <Button onClick={handleBack}>
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        size="large"
                      >
                        Review & Submit
                      </Button>
                    </Box>
                  </Box>
                )}

                {activeStep === 3 && (
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Final Review
                    </Typography>

                    <Alert severity="success" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Evaluation Complete!
                      </Typography>
                      Total Score: {getTotalScore().toFixed(1)}/10
                    </Alert>

                    <Typography variant="h6" gutterBottom>
                      Score Breakdown:
                    </Typography>

                    {submission.criteria.map((criteria) => (
                      <Box key={criteria.id} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                        <Typography variant="body1">
                          {criteria.name} ({criteria.weight}%)
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Rating value={scores[criteria.id]} readOnly max={criteria.maxScore} />
                          <Typography variant="body2" fontWeight="bold">
                            {scores[criteria.id]}/{criteria.maxScore}
                          </Typography>
                        </Box>
                      </Box>
                    ))}

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" gutterBottom>
                      Your Feedback:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        {feedback || 'No detailed feedback provided'}
                      </Typography>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        {finalComments || 'No additional recommendations provided'}
                      </Typography>
                    </Paper>

                    <Box display="flex" justifyContent="space-between" mt={4}>
                      <Button onClick={handleBack}>
                        Back
                      </Button>
                      <Box display="flex" gap={2}>
                        <Button
                          variant="outlined"
                          startIcon={<SaveIcon />}
                          onClick={() => setSaveDialogOpen(true)}
                        >
                          Save Draft
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          size="large"
                          startIcon={<SendIcon />}
                          onClick={() => setSubmitDialogOpen(true)}
                        >
                          Submit Final Evaluation
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6" fontWeight="bold">
              Submit Final Evaluation
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you ready to submit your evaluation for <strong>{submission.teamName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Once submitted, you won&apos;t be able to modify your scores or feedback. Your final score is <strong>{getTotalScore().toFixed(1)}/10</strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setSubmitDialogOpen(false)
              router.push('/judge?success=evaluation-submitted')
            }}
          >
            Confirm Submission
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
        <Fab
          color="secondary"
          aria-label="feedback"
          sx={{ mr: 2 }}
          onClick={() => setFeedback('Quick feedback note...')}
        >
          <FeedbackIcon />
        </Fab>
        <Fab
          color="primary"
          aria-label="save"
          onClick={() => setSaveDialogOpen(true)}
        >
          <SaveIcon />
        </Fab>
      </Box>
    </Box>
  )
}