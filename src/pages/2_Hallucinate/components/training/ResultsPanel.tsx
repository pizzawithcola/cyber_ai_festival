import { Typography, Box, Card, CardContent, CardHeader, Button, Paper, Divider, Stack } from '@mui/material';

import { NEON_CYAN } from '../../hallucinateUi';
import { evidenceChecklistForSentence } from './utils';
import { type ResultPage, type ResultPitfalls } from './types';

export function ResultsPanel({
  resultPage,
  score,
  resultPitfalls,
  feedback,
  feedbackDetail,
  feedbackColor,
  onNext,
}: {
  resultPage: Exclude<ResultPage, 'complete'>;
  score: number;
  resultPitfalls: ResultPitfalls;
  feedback: string;
  feedbackDetail: string;
  feedbackColor: string;
  onNext: () => void;
}) {
  return (
    <Box sx={{ mt: 2 }}>
      {resultPage === 'summary' && (
        <Stack spacing={2}>
          <Paper
            sx={{
              p: 2,
              border: `1px solid ${NEON_CYAN}`,
              background: 'linear-gradient(135deg, rgba(0, 255, 217, 0.12), rgba(46, 227, 255, 0.06))',
              boxShadow: '0 0 18px rgba(0, 255, 217, 0.2)',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#eaffff', mb: 0.75 }}>
              Round complete
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: NEON_CYAN, mb: 1 }}>
              Score {score}
            </Typography>
            <Box
              sx={{
                mt: 0.25,
                px: 1.1,
                py: 0.9,
                borderRadius: 1,
                border: `1px solid ${feedbackColor}`,
                backgroundColor: 'rgba(0, 0, 0, 0.12)',
              }}
            >
              <Typography variant="body2" sx={{ color: '#d7f2ff', lineHeight: 1.7 }}>
                <Box component="span" sx={{ color: feedbackColor, fontWeight: 900 }}>
                  {feedback}
                </Box>
                {' — '}
                {feedbackDetail}
              </Typography>
            </Box>
          </Paper>
        </Stack>
      )}

      {resultPage === 'correct' && (
        <Card sx={{ boxShadow: 0, border: '1px solid #eee' }}>
          <CardHeader
            title={
              <Typography variant="subtitle1" sx={{ fontWeight: 900, fontSize: { xs: '1.08rem', sm: '1.16rem' } }}>
                ✅ Correct pitfalls you flagged
              </Typography>
            }
          />
          <Divider />
          <CardContent sx={{ pt: 2 }}>
            {resultPitfalls.correct.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                None yet. Watch <b>exact numbers</b>, <b>&quot;first-ever&quot;</b>, and <b>DOIs</b>.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {resultPitfalls.correct.map((p) => {
                  return (
                    <Paper key={p.id} sx={{ p: 1.2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 900,
                          color: '#eaffff',
                          letterSpacing: '0.2px',
                          backgroundColor: 'rgba(0, 255, 217, 0.08)',
                          border: '1px solid rgba(0, 255, 217, 0.35)',
                          borderRadius: 1,
                          px: 1,
                          py: 0.4,
                          display: 'inline-block',
                          fontFamily: p.type === 'CITATION_FABRICATION' ? "'VT323', 'Courier New', monospace" : undefined,
                        }}
                      >
                        {p.text}
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.9,
                          p: 0.9,
                          borderRadius: 1,
                          border: '1px solid rgba(91, 46, 255, 0.35)',
                          backgroundColor: 'rgba(91, 46, 255, 0.08)',
                        }}
                      >
                        {p.reason && (
                          <Typography variant="caption" sx={{ color: '#cdd9ff', display: 'block', lineHeight: 1.4 }}>
                            {p.reason}
                          </Typography>
                        )}
                        <Stack spacing={0.25} sx={{ mt: p.reason ? 0.5 : 0 }}>
                          {evidenceChecklistForSentence(p).map((line) => (
                            <Typography key={line} variant="caption" sx={{ color: '#c7d3ff', lineHeight: 1.5, display: 'block' }}>
                              • {line}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {resultPage === 'missed' && (
        <Card sx={{ boxShadow: 0, border: '1px solid #eee' }}>
          <CardHeader
            title={
              <Typography variant="subtitle1" sx={{ fontWeight: 900, fontSize: { xs: '1.08rem', sm: '1.16rem' } }}>
                ⚠️ Missed pitfalls
              </Typography>
            }
          />
          <Divider />
          <CardContent sx={{ pt: 2 }}>
            {resultPitfalls.missed.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                Great — no missed pitfalls.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {resultPitfalls.missed.map((p) => {
                  return (
                    <Paper key={p.id} sx={{ p: 1.2, border: `2px solid ${p.severity === 'critical' ? '#f44336' : '#ff9800'}` }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 900,
                          color: '#eaffff',
                          letterSpacing: '0.2px',
                          backgroundColor: 'rgba(0, 255, 217, 0.08)',
                          border: '1px solid rgba(0, 255, 217, 0.35)',
                          borderRadius: 1,
                          px: 1,
                          py: 0.4,
                          display: 'inline-block',
                          fontFamily: p.type === 'CITATION_FABRICATION' ? "'VT323', 'Courier New', monospace" : undefined,
                        }}
                      >
                        {p.text}
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.9,
                          p: 0.9,
                          borderRadius: 1,
                          border: '1px solid rgba(91, 46, 255, 0.35)',
                          backgroundColor: 'rgba(91, 46, 255, 0.08)',
                        }}
                      >
                        {p.reason && (
                          <Typography variant="caption" sx={{ color: '#cdd9ff', display: 'block', lineHeight: 1.4 }}>
                            {p.reason}
                          </Typography>
                        )}
                        <Stack spacing={0.25} sx={{ mt: p.reason ? 0.5 : 0 }}>
                          {evidenceChecklistForSentence(p).map((line) => (
                            <Typography key={line} variant="caption" sx={{ color: '#c7d3ff', lineHeight: 1.5, display: 'block' }}>
                              • {line}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {resultPage === 'falsePos' && (
        <Card sx={{ boxShadow: 0, border: '1px solid #eee' }}>
          <CardHeader
            title={
              <Typography variant="subtitle1" sx={{ fontWeight: 900, fontSize: { xs: '1.08rem', sm: '1.16rem' } }}>
                🧨 False positives
              </Typography>
            }
          />
          <Divider />
          <CardContent sx={{ pt: 2 }}>
            {resultPitfalls.falsePos.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                Nice — no false positives.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {resultPitfalls.falsePos.map((p) => (
                  <Paper key={p.id} sx={{ p: 1.2, border: p.isDecoySafe ? '2px solid #00bcd4' : undefined }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 900,
                        color: '#eaffff',
                        letterSpacing: '0.2px',
                        backgroundColor: 'rgba(0, 255, 217, 0.08)',
                        border: '1px solid rgba(0, 255, 217, 0.35)',
                        borderRadius: 1,
                        px: 1,
                        py: 0.4,
                        display: 'inline-block',
                        fontFamily: p.type === 'CITATION_FABRICATION' ? "'VT323', 'Courier New', monospace" : undefined,
                      }}
                    >
                      {p.text}
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.9,
                        p: 0.9,
                        borderRadius: 1,
                        border: '1px solid rgba(91, 46, 255, 0.35)',
                        backgroundColor: 'rgba(91, 46, 255, 0.08)',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#cdd9ff', display: 'block', lineHeight: 1.4 }}>
                        {p.isDecoySafe ? 'Decoy (safe) — cautious language is good.' : 'Not a pitfall. Avoid over-flagging.'}
                      </Typography>
                      {p.isDecoySafe && (
                        <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                          {evidenceChecklistForSentence(p).map((line) => (
                            <Typography key={line} variant="caption" sx={{ color: '#c7d3ff', lineHeight: 1.5, display: 'block' }}>
                              • {line}
                            </Typography>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={onNext} sx={{ fontWeight: 900 }}>
          Next
        </Button>
      </Box>
    </Box>
  );
}
