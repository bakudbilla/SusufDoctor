import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Search, User, Eye, FileText, X, Loader2 } from 'lucide-react';
import { API_URL } from '../../utils/constant';


export default function PatientRevisitSystem() {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  const itemsPerPage = 10;

  // Fetch all patients on component 
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/patients/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('API Response - All Patients:', data);
      
      if (data.status === 'success') {
      
        const processedPatients = (data.data || []).map(patient => ({
          ...patient,
          visit_count: patient.visit_count || 0
        }));
        
        console.log('Processed patients with visit counts:', processedPatients);
        setPatients(processedPatients);
      } else {
        setError('Failed to fetch patients');
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Error fetching patients. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (patientId) => {
    try {
      setLoadingPatient(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/patients/${patientId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Patient Details Response:', data);
      
      if (data.status === 'success') {
        setSelectedPatient(data.data);
      } else {
        setError('Failed to fetch patient details');
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
      setError('Error fetching patient details');
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleViewReport = (reportUrl) => {
    if (reportUrl) {
      setPdfUrl(reportUrl);
      setShowPdfViewer(true);
    }
  };

  const filteredPatients = patients.filter(patient =>
    (patient.patient_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (patient.patient_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {currentPatients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <User className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">No patients found</p>
              {searchTerm && <p className="text-sm text-muted-foreground">Try searching with different criteria</p>}
            </CardContent>
          </Card>
        ) : (
          currentPatients.map(patient => (
            <Card key={patient.patient_id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{patient.patient_name}</h3>
                      <Badge variant="outline">{patient.patient_id}</Badge>
                      <Badge className="bg-green-100 text-green-800">
                        {patient.visit_count || 0} {patient.visit_count === 1 ? 'visit' : 'visits'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Age:</span>
                        <p className="font-medium">{patient.age} years</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender:</span>
                        <p className="font-medium">{patient.sex}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">BMI:</span>
                        <p className="font-medium">{patient.bmi}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Latest Visit:</span>
                        <p className="font-medium">{patient.latest_visit ? new Date(patient.latest_visit).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className='cursor-pointer'
                        onClick={() => handleViewDetails(patient.patient_id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden pt-8">
                      {loadingPatient ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : selectedPatient ? (
                        <>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <User className="h-5 w-5" />
                              {selectedPatient.patient_name}
                            </DialogTitle>
                            <DialogDescription>
                              Patient ID: {selectedPatient.patient_id} • {selectedPatient.visit_count} total {selectedPatient.visit_count === 1 ? 'visit' : 'visits'}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="flex-1 overflow-y-auto pr-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <style>{`::-webkit-scrollbar { display: none; }`}</style>

                            <div className="space-y-6">
                              {/* Patient Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Age</Label>
                                  <p className="font-medium">{selectedPatient.age} years</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Gender</Label>
                                  <p className="font-medium">{selectedPatient.sex}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">BMI</Label>
                                  <p className="font-medium">{selectedPatient.bmi}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Total Visits</Label>
                                  <p className="font-medium">{selectedPatient.visit_count}</p>
                                </div>
                              </div>

                              {/* Visit History */}
                              <div>
                                <Label className="text-base font-semibold mb-3 block">Visit History</Label>

                                {selectedPatient.visits && selectedPatient.visits.length > 0 ? (
                                  <div className="space-y-3">
                                    {selectedPatient.visits.map((visit, idx) => (
                                      <div key={visit.visit_id} className="p-4 bg-muted/50 rounded-lg border">
                                        <div className="flex justify-between items-start mb-3">
                                          <Badge variant="secondary">Visit #{selectedPatient.visit_count - idx}</Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(visit.date).toLocaleDateString()}
                                          </span>
                                        </div>

                                        <p className="font-medium text-sm mb-2">{visit.reason}</p>
                                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{visit.notes}</p>

                                        {/* PDF Report Button */}
                                        {visit.report_pdf && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleViewReport(visit.report_pdf)}
                                            className="w-full"
                                          >
                                            <FileText className="h-4 w-4 mr-2" />
                                            View Report PDF
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground text-sm">No visits recorded</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredPatients.length > 10 && (
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Previous
          </Button>

          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden pt-8">
          <DialogHeader>
            <DialogTitle>Medical Report</DialogTitle>
            <button
              onClick={() => setShowPdfViewer(false)}
              className="absolute right-4 top-4 p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-full border rounded"
              style={{ scrollbarWidth: 'thin' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}