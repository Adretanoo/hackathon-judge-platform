import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';

export class AIService {
  private openai: OpenAI;
  private model: string;

  constructor(private app: FastifyInstance) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async evaluateProject(projectId: string): Promise<any> {
    // 1. Fetch Project Details
    const project = await this.app.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          select: { name: true, trackId: true }
        }
      }
    });

    if (!project) throw new Error('Project not found');
    if (!project.team?.trackId) throw new Error('Project has no track assigned');

    // 2. Fetch Track Criteria
    const criteria = await this.app.prisma.criteria.findMany({
      where: { trackId: project.team.trackId }
    });

    if (criteria.length === 0) throw new Error('No criteria found for this track');

    // 3. Construct the Evaluation Prompt
    const systemPrompt = `You are an expert Software Engineer and Hackathon Judge. You are evaluating a hackathon project.
    Provide a fair and critical evaluation of the project based on the provided details. 
    You must output your evaluation strictly in JSON format.
    
    JSON Schema Requirements:
    {
       "scores": [
         {
           "criteriaId": "string",
           "scoreValue": number,
         }
       ],
       "generalComment": "string"
    }

    Rules:
    1. Evaluate each criterion exactly. 
    2. Provide a score strictly between 0 and maxScore for that criterion. Evaluate strictly.
    3. The generalComment should contain a detailed reasoning for the scores given (at least 2 paragraphs). Include strengths and weaknesses. Be encouraging but professional. Always use Ukrainian language for the comment!
    4. Provide valid JSON and nothing else. No markdown wrappers.`;

    const projectData = {
      title: project.title,
      description: project.description,
      techStack: project.techStack.join(', '),
      repositoryUrl: project.repoUrl,
      demoUrl: project.demoUrl,
      videoUrl: project.videoUrl,
    };

    const criteriaData = criteria.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      weight: c.weight,
      maxScore: c.maxScore
    }));

    const userPrompt = `
      Project Details:
      ${JSON.stringify(projectData, null, 2)}
      
      Evaluation Criteria:
      ${JSON.stringify(criteriaData, null, 2)}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0]?.message?.content;
      if (!result) throw new Error('AI returned empty response');
      
      const parsed = JSON.parse(result);
      return parsed;

    } catch (error: any) {
      this.app.log.error('AI Evaluation error:', error);
      throw new Error('Failed to perform AI evaluation');
    }
  }
}
