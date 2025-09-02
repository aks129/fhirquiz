import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CreditCard, Search, ExternalLink, DollarSign, Calendar, User } from "lucide-react";

interface Purchase {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  product_sku: string;
  product_name: string;
  amount_cents: number;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  purchased_at: string;
}

interface BillingStats {
  total_revenue: number;
  total_purchases: number;
  pending_payments: number;
  monthly_revenue: number;
}

export function BillingTab() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch billing stats
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/billing/stats'],
    retry: false
  });

  // Fetch purchases
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['/api/admin/billing/purchases'],
    retry: false
  });

  // Filter purchases based on search
  const filteredPurchases = purchases.filter((purchase: Purchase) => 
    purchase.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default' as const;
      case 'pending': return 'secondary' as const;
      case 'failed': return 'destructive' as const;
      case 'refunded': return 'outline' as const;
      default: return 'secondary' as const;
    }
  };

  const openStripeCustomer = (customerId: string) => {
    window.open(`https://dashboard.stripe.com/customers/${customerId}`, '_blank');
  };

  const openStripePayment = (paymentIntentId: string) => {
    window.open(`https://dashboard.stripe.com/payments/${paymentIntentId}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatPrice(stats.total_revenue) : '$-'}
            </div>
            <p className="text-xs text-muted-foreground">All-time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_purchases || '-'}
            </div>
            <p className="text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatPrice(stats.monthly_revenue) : '$-'}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pending_payments || '-'}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Purchase History
              </CardTitle>
              <CardDescription>
                View all transactions and link to Stripe Dashboard for details
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <a 
                href="https://dashboard.stripe.com/payments" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Stripe Dashboard
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by email, name, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-purchases"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredPurchases.length} transaction{filteredPurchases.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Purchases Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading transactions...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase: Purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {purchase.user_name || 'Anonymous'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {purchase.user_email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{purchase.product_name}</div>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {purchase.product_sku}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium">
                        {formatPrice(purchase.amount_cents)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(purchase.status)}>
                        {purchase.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(purchase.purchased_at).toLocaleDateString()} 
                      <div className="text-sm text-gray-500">
                        {new Date(purchase.purchased_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {purchase.stripe_payment_intent_id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openStripePayment(purchase.stripe_payment_intent_id!)}
                            title="View payment in Stripe"
                            data-testid={`view-payment-${purchase.id}`}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                        {purchase.stripe_customer_id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openStripeCustomer(purchase.stripe_customer_id!)}
                            title="View customer in Stripe"
                            data-testid={`view-customer-${purchase.id}`}
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                          title="View in Stripe Dashboard"
                        >
                          <a 
                            href={`https://dashboard.stripe.com/payments/${purchase.stripe_payment_intent_id}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            data-testid={`view-stripe-${purchase.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredPurchases.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transactions found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}