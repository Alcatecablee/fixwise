const jobManager = require('./lib/job-manager');
const cliRunner = require('./lib/cli-runner');

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  
  const recentRequests = userRequests.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  return true;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    console.log('[API] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log('[API] Analyze request from IP:', ip);

  if (!checkRateLimit(ip)) {
    console.log('[API] Rate limit exceeded for IP:', ip);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

  try {
    // Ensure body is available - sometimes proxy middleware consumes it
    let body = req.body;

    console.log('[API] Request body type:', typeof body, 'is object:', typeof body === 'object');

    // If body is empty or not an object, try to parse from raw stream
    if (!body || typeof body !== 'object') {
      console.log('[API] Invalid body, returning 400');
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must be valid JSON'
      });
    }

    const { code, options = {} } = body;

    console.log('[API] Code received, length:', code ? code.length : 'null');

    if (!code || typeof code !== 'string') {
      console.log('[API] Invalid code');
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Code must be a non-empty string'
      });
    }

    if (code.length > 100000) {
      console.log('[API] Code too large:', code.length);
      return res.status(400).json({
        error: 'Code too large',
        message: 'Code must be less than 100KB'
      });
    }

    const job = jobManager.createJob(code, options);
    console.log('[API] Job created:', job.id);

    res.status(202).json({
      success: true,
      jobId: job.id,
      status: job.status,
      message: 'Analysis started'
    });

    setImmediate(async () => {
      try {
        console.log('[API] Starting analysis for job:', job.id);
        jobManager.updateJob(job.id, { status: 'running' });

        const result = await cliRunner.analyzeCode(
          code,
          options,
          (progress) => {
            if (progress.type === 'layer_start') {
              jobManager.updateLayerProgress(
                job.id,
                progress.layerId,
                'processing',
                { name: progress.name }
              );
            } else if (progress.type === 'layer_complete') {
              jobManager.updateLayerProgress(
                job.id,
                progress.layerId,
                'completed',
                {
                  name: progress.name,
                  issuesFound: progress.issuesFound
                }
              );
            }
          }
        );

        console.log('[API] Analysis complete, issues found:', result.detectedIssues ? result.detectedIssues.length : 0);

        if (result.detectedIssues) {
          result.detectedIssues.forEach(issue => jobManager.addIssue(job.id, issue));
        }

        if (result.detectedIssues && result.detectedIssues.length > 0) {
          console.log('[API] Applying fixes for job:', job.id);
          const fixResult = await cliRunner.fixCode(
            code,
            result.detectedIssues,
            options
          );

          if (fixResult.success) {
            result.transformedCode = fixResult.code;
            result.appliedFixes = fixResult.appliedFixes;
            console.log('[API] Fixes applied');
          }
        }

        jobManager.completeJob(job.id, {
          transformedCode: result.transformedCode || code,
          detectedIssues: result.detectedIssues || [],
          layerResults: result.layerResults || [],
          appliedFixes: result.appliedFixes || [],
          processingTime: Date.now() - job.createdAt
        });

        console.log('[API] Job completed:', job.id);

      } catch (error) {
        console.error('[API] Analysis error for job', job.id, ':', error);
        jobManager.failJob(job.id, error.message);
      }
    });

  } catch (error) {
    console.error('[API] Request handling error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
