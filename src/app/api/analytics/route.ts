import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyAnalytics } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const analytics = getMonthlyAnalytics(month);
    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao processar estatísticas', details: err.message }, { status: 500 });
  }
}
