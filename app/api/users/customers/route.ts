import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const customers = await prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      include: {
        orders: true,
        installments: true,
        registeredACs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Format the response for the admin dashboard
    const formattedCustomers = customers.map(customer => {
      const activeInstallments = customer.installments.filter(i => i.status !== 'COMPLETED').length;
      const totalOrders = customer.orders.length;
      
      // Determine the primary contact location from the latest order/installment, or use a default
      let location = 'Not Provided';
      if (customer.orders.length > 0) {
        location = customer.orders[0].location;
      } else if (customer.installments.length > 0) {
        location = customer.installments[0].location || 'Not Provided';
      }

      return {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone || 'N/A',
        location,
        totalAcs: customer.registeredACs?.length || 0, // Use actual registered ACs count
        activeInstallment: activeInstallments > 0 ? 'Yes' : 'None',
        installments: customer.installments,
        orders: customer.orders,
        registeredACs: customer.registeredACs,
      };
    });

    return NextResponse.json(formattedCustomers);
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

// PATCH /api/users/customers - Update customer profile
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, firstName, lastName, phone } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
